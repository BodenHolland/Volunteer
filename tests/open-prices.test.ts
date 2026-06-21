import { test } from "node:test";
import assert from "node:assert";
import {
  isoDate,
  MAX_RETRY_ATTEMPTS,
  nextRetryDelayMs,
  normalizeUnitPrice,
  OFF_PRODUCT_CODES,
  OPEN_PRICES_BASE,
  OPEN_PRICES_PROJECT_TAG,
  postOpenPrice,
} from "@/lib/open-prices";
import { USDA_THRIFTY_6 } from "@/lib/food-audit";

test("project tag is the canonical Tended food access tag", () => {
  assert.strictEqual(OPEN_PRICES_PROJECT_TAG, "tended-ca-food-access");
});

test("every non-produce basket item has a mapped OFF product code", () => {
  for (const item of USDA_THRIFTY_6.items) {
    if (item.category === "produce") continue;
    assert.ok(
      OFF_PRODUCT_CODES[item.id],
      `missing OFF product code for ${item.id}`
    );
  }
});

test("produce is intentionally skipped (region-specific)", () => {
  assert.strictEqual(OFF_PRODUCT_CODES["produce-banana-or-apple"], null);
});

test("isoDate emits YYYY-MM-DD in UTC", () => {
  assert.strictEqual(isoDate(Date.UTC(2026, 5, 20, 12, 0, 0)), "2026-06-20");
  assert.strictEqual(isoDate(0), "1970-01-01");
});

test("normalizeUnitPrice rounds to 2 decimals", () => {
  const item = USDA_THRIFTY_6.items[0];
  assert.strictEqual(normalizeUnitPrice(item, 4.999), 5.0);
  assert.strictEqual(normalizeUnitPrice(item, 4.991), 4.99);
});

test("retry ladder grows monotonically and caps", () => {
  const d0 = nextRetryDelayMs(0);
  const d1 = nextRetryDelayMs(1);
  const d2 = nextRetryDelayMs(2);
  const d3 = nextRetryDelayMs(3);
  const dHi = nextRetryDelayMs(99);
  assert.ok(d0 < d1 && d1 < d2 && d2 < d3);
  assert.strictEqual(dHi, d3); // capped
  assert.ok(MAX_RETRY_ATTEMPTS >= 3);
});

test("postOpenPrice returns ok:true and the upstream id on 200", async () => {
  const originalFetch = globalThis.fetch;
  let calledUrl = "";
  let calledBody = "";
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    calledUrl = url;
    calledBody = String(init?.body ?? "");
    return new Response(JSON.stringify({ id: 42 }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  try {
    const r = await postOpenPrice({
      token: "test-token",
      price: {
        product_code: "0070038501022",
        price: 4.99,
        currency: "USD",
        date: "2026-06-20",
        source: "tended-ca-food-access:aud_abc",
        location_label: "Safeway, 2020 Market St",
      },
    });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.open_prices_id, "42");
    assert.strictEqual(calledUrl, `${OPEN_PRICES_BASE}/prices`);
    assert.match(calledBody, /tended-ca-food-access:aud_abc/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("postOpenPrice returns ok:false on non-2xx", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response("rate limited", { status: 429 })) as typeof fetch;
  try {
    const r = await postOpenPrice({
      token: "test-token",
      price: {
        product_code: "0070038501022",
        price: 4.99,
        currency: "USD",
        date: "2026-06-20",
        source: "tended-ca-food-access:aud_abc",
      },
    });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.status, 429);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("postOpenPrice returns ok:false when fetch throws", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error("network down");
  }) as typeof fetch;
  try {
    const r = await postOpenPrice({
      token: "test-token",
      price: {
        product_code: "0070038501022",
        price: 4.99,
        currency: "USD",
        date: "2026-06-20",
        source: "x",
      },
    });
    assert.strictEqual(r.ok, false);
    assert.match(r.error ?? "", /network down/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
