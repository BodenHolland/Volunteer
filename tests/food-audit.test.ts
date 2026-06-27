import { test } from "node:test";
import assert from "node:assert";
import {
  ANTI_DUP_WINDOW_DAYS,
  AUDIT_CAP_MINUTES,
  COMMUTE_CAP_MINUTES,
  CREDIT_MINUTES_PER_ITEM,
  creditedHoursFromAuditInputs,
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

test("Hard rule: travel credit is capped at on-task time (proportionality) — a far store can't inflate hours", () => {
  const items = 6;
  const docMin = items * CREDIT_MINUTES_PER_ITEM; // 30 min of real work
  const hrs = (min: number) => Math.round((min / 60) * 100) / 100;

  // No commute → just the on-task time.
  assert.strictEqual(creditedHoursFromAuditInputs(items, null), hrs(docMin));

  // Short local trip (10 min one-way = 20 round-trip, under docMin) credits fully.
  assert.strictEqual(creditedHoursFromAuditInputs(items, 10 * 60), hrs(docMin + 20));

  // Far store: 90 min one-way (180 round-trip) is clamped to the on-task time
  // (30 min), NOT 180. Total = 60 min, not the old ~2-hour ceiling.
  assert.strictEqual(creditedHoursFromAuditInputs(items, 90 * 60), hrs(docMin + docMin));

  // Even an absurd distance can never make commute exceed on-task time.
  const absurd = creditedHoursFromAuditInputs(items, 5 * 3600); // 5h one-way
  assert.strictEqual(absurd, hrs(docMin + docMin));

  // Absolute backstops still bind for unusually large audits: 20 items → 100 min
  // on-task, but commute is capped at COMMUTE_CAP_MINUTES and total at AUDIT_CAP.
  const big = creditedHoursFromAuditInputs(20, 60 * 60); // 120-min round trip
  assert.strictEqual(big, hrs(Math.min(AUDIT_CAP_MINUTES, 20 * CREDIT_MINUTES_PER_ITEM + COMMUTE_CAP_MINUTES)));
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

test("Hard rule: geocode must be inside US bounds (any state)", () => {
  // SF coords → in US
  assert.strictEqual(isInCalifornia(37.77, -122.42), true);
  // NYC → in US
  assert.strictEqual(isInCalifornia(40.7, -74.0), true);
  // Anchorage → in US
  assert.strictEqual(isInCalifornia(61.2, -149.9), true);
  // Honolulu → in US
  assert.strictEqual(isInCalifornia(21.3, -157.85), true);
  // Tijuana → outside US
  assert.strictEqual(isInCalifornia(17.4, -99.1), false);
  // London → outside US
  assert.strictEqual(isInCalifornia(51.5, -0.13), false);
  // missing
  assert.strictEqual(isInCalifornia(null, null), false);

  const result = syncValidate({
    captures: allSixCaptures(),
    store_geocode: { lat: 51.5, lng: -0.13 }, // London
    session_time_seconds: 600,
    prior_audit_count_at_store_in_window: 0,
    rapid_submission_count_last_hour: 0,
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.reason ?? "", /US/i);
});

test("Hard rule: PII (SSN, payment card, email) is detected in free-text", () => {
  assert.match(detectPii("My SSN is 123-45-6789") ?? "", /SSN/);
  assert.match(detectPii("card 4111 1111 1111 1111") ?? "", /card/);
  assert.match(detectPii("contact alice@example.com") ?? "", /email/);
  assert.strictEqual(detectPii("Safeway on Market Street"), null);
});

test("Session time has no gating effect — credit is items × 5 min + commute", () => {
  // Timer was removed: any session length (including 0) is accepted and produces
  // no "session-too-long" or "too quick" flags. Credit comes from items + commute.
  for (const seconds of [0, SESSION_MIN_SECONDS - 1, SESSION_MAX_SECONDS + 60]) {
    const result = syncValidate({
      captures: allSixCaptures(),
      store_geocode: { lat: 37.77, lng: -122.42 },
      session_time_seconds: seconds,
      prior_audit_count_at_store_in_window: 0,
      rapid_submission_count_last_hour: 0,
    });
    assert.strictEqual(result.ok, true, `expected ok=true for ${seconds}s`);
    assert.ok(
      !result.flags.some((f) => f.flag_type === "session-too-long"),
      `expected no session-too-long flag for ${seconds}s`
    );
  }
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
