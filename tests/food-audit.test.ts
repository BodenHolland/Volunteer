import { test } from "node:test";
import assert from "node:assert";
import {
  ANTI_DUP_WINDOW_DAYS,
  creditedHoursFromSeconds,
  detectPii,
  isInCalifornia,
  SESSION_CAP_MINUTES,
  SESSION_MAX_SECONDS,
  SESSION_MIN_SECONDS,
  syncValidate,
  USDA_THRIFTY_6,
  validateCapture,
  type CaptureInput,
} from "@/lib/food-audit";

const goodCapture = (overrides: Partial<CaptureInput> = {}): CaptureInput => ({
  stock_status: "in-stock",
  price_usd: 4.99,
  size_value: 1,
  size_unit: "gal",
  has_photo: true,
  ...overrides,
});

const allSixCaptures = (overrides: Record<string, CaptureInput> = {}) =>
  USDA_THRIFTY_6.items.map((it) => {
    const def: CaptureInput = {
      stock_status: "in-stock",
      price_usd: (it.plausibility_band_usd_low + it.plausibility_band_usd_high) / 2,
      size_value: it.expected_size_range_min,
      size_unit: it.unit_options[0],
      has_photo: true,
      ...(it.category === "produce" ? { produce_pricing_mode: "per-pound" as const } : {}),
    };
    return { item_id: it.id, capture: overrides[it.id] ?? def };
  });

test("Hard rule: hour credit is measured time, capped at the calibrated cap", () => {
  // measured 5 minutes → 5/60 hours
  assert.strictEqual(creditedHoursFromSeconds(5 * 60), Math.round((5 / 60) * 100) / 100);
  // measured 10 minutes → 10/60
  assert.strictEqual(creditedHoursFromSeconds(10 * 60), Math.round((10 / 60) * 100) / 100);
  // measured 30 minutes → capped at SESSION_CAP_MINUTES (15)
  const capped = creditedHoursFromSeconds(30 * 60);
  assert.strictEqual(capped, Math.round((SESSION_CAP_MINUTES / 60) * 100) / 100);
  // measured 0 → 0
  assert.strictEqual(creditedHoursFromSeconds(0), 0);
});

test("Hard rule: in-stock items require photo + price + size", () => {
  // valid baseline
  assert.strictEqual(validateCapture("milk-gallon", goodCapture()), null);
  // missing photo
  assert.match(
    validateCapture("milk-gallon", goodCapture({ has_photo: false })) ?? "",
    /photo/i
  );
  // missing price
  assert.match(
    validateCapture("milk-gallon", goodCapture({ price_usd: undefined })) ?? "",
    /price/i
  );
  // missing size
  assert.match(
    validateCapture("milk-gallon", goodCapture({ size_value: undefined })) ?? "",
    /size/i
  );
  // out-of-stock requires neither
  assert.strictEqual(
    validateCapture("milk-gallon", { stock_status: "out-of-stock" }),
    null
  );
});

test("Hard rule: anti-dup blocks second audit of same store in 7-day window", () => {
  const result = syncValidate({
    captures: allSixCaptures(),
    store_geocode: { lat: 37.77, lng: -122.42 }, // SF
    session_time_seconds: 600,
    prior_audit_count_at_store_in_window: 1, // already audited
    rapid_submission_count_last_hour: 0,
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.reason ?? "", /already audited/i);
  assert.strictEqual(ANTI_DUP_WINDOW_DAYS, 7);
});

test("Hard rule: geocode must be in California", () => {
  // SF coords → in CA
  assert.strictEqual(isInCalifornia(37.77, -122.42), true);
  // Tijuana → outside CA (south of 32.5)
  assert.strictEqual(isInCalifornia(32.51, -117.03), true); // border edge
  assert.strictEqual(isInCalifornia(32.4, -117.03), false);
  // NYC
  assert.strictEqual(isInCalifornia(40.7, -74.0), false);
  // missing
  assert.strictEqual(isInCalifornia(null, null), false);

  const result = syncValidate({
    captures: allSixCaptures(),
    store_geocode: { lat: 40.7, lng: -74.0 }, // NYC
    session_time_seconds: 600,
    prior_audit_count_at_store_in_window: 0,
    rapid_submission_count_last_hour: 0,
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.reason ?? "", /california/i);
});

test("Hard rule: PII (SSN, payment card, email) is detected in free-text", () => {
  assert.match(detectPii("My SSN is 123-45-6789") ?? "", /SSN/);
  assert.match(detectPii("card 4111 1111 1111 1111") ?? "", /card/);
  assert.match(detectPii("contact alice@example.com") ?? "", /email/);
  assert.strictEqual(detectPii("Safeway on Market Street"), null);
});

test("Session time must be between min and max", () => {
  const tooFast = syncValidate({
    captures: allSixCaptures(),
    store_geocode: { lat: 37.77, lng: -122.42 },
    session_time_seconds: SESSION_MIN_SECONDS - 1,
    prior_audit_count_at_store_in_window: 0,
    rapid_submission_count_last_hour: 0,
  });
  assert.strictEqual(tooFast.ok, false);
  assert.match(tooFast.reason ?? "", /too quick/i);

  const tooLong = syncValidate({
    captures: allSixCaptures(),
    store_geocode: { lat: 37.77, lng: -122.42 },
    session_time_seconds: SESSION_MAX_SECONDS + 60,
    prior_audit_count_at_store_in_window: 0,
    rapid_submission_count_last_hour: 0,
  });
  assert.strictEqual(tooLong.ok, true);
  assert.ok(tooLong.flags.some((f) => f.flag_type === "session-too-long"));
});

test("Price outliers flag but do not block", () => {
  const result = syncValidate({
    captures: allSixCaptures({
      "milk-gallon": goodCapture({ price_usd: 99.99 }), // way over band
    }),
    store_geocode: { lat: 37.77, lng: -122.42 },
    session_time_seconds: 600,
    prior_audit_count_at_store_in_window: 0,
    rapid_submission_count_last_hour: 0,
  });
  assert.strictEqual(result.ok, true);
  assert.ok(result.flags.some((f) => f.flag_type === "price-outlier"));
});

test("Produce requires per-pound vs per-unit", () => {
  const err = validateCapture("produce-banana-or-apple", {
    stock_status: "in-stock",
    price_usd: 0.79,
    size_value: 1,
    size_unit: "lb",
    has_photo: true,
  });
  assert.match(err ?? "", /per pound|per unit|produce/i);
});

test("All 6 captures required to submit", () => {
  const result = syncValidate({
    captures: allSixCaptures().slice(0, 3),
    store_geocode: { lat: 37.77, lng: -122.42 },
    session_time_seconds: 600,
    prior_audit_count_at_store_in_window: 0,
    rapid_submission_count_last_hour: 0,
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.reason ?? "", /6 basket items/i);
});

test("Basket template matches handoff spec (6 items, correct categories)", () => {
  assert.strictEqual(USDA_THRIFTY_6.items.length, 6);
  const cats = USDA_THRIFTY_6.items.map((i) => i.category).sort();
  assert.deepStrictEqual(cats, ["beans", "bread", "dairy", "eggs", "produce", "rice"]);
});
