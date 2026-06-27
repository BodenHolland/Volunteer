import { test } from "node:test";
import assert from "node:assert";
import { secondsToHours, MIN_ENGAGEMENT_SECONDS } from "@/lib/engagement";
import { computeCreditedHours } from "@/lib/ledger";

test("secondsToHours converts seconds to hours", () => {
  assert.equal(secondsToHours(3600), 1);
  assert.equal(secondsToHours(1800), 0.5);
  assert.equal(secondsToHours(0), 0);
  assert.equal(secondsToHours(5400), 1.5);
});

test("MIN_ENGAGEMENT_SECONDS is a positive floor", () => {
  assert.equal(MIN_ENGAGEMENT_SECONDS, 60);
});

/**
 * MONEY MATH — exercises the SHIPPING `computeCreditedHours` (lib/ledger.ts),
 * the function the org-approve path actually calls. (The previous version of
 * this file tested a re-implemented local copy — a decoy that could pass while
 * the real function regressed.)
 *
 * Hard line #1 (legal): credited hours are the volunteer's MEASURED ACTIVE
 * time, capped at the calibrated cap. The reviewer may only REDUCE for quality,
 * never credit ABOVE measured time; rejected/zero-effort work earns zero.
 */

const h = (sec: number) => sec; // seconds helper for readability

test("credited never exceeds measured time (measured below cap)", () => {
  // 2h measured, 5h cap, no reviewer reduction → credited = measured = 2h.
  const r = computeCreditedHours({ measuredSeconds: h(2 * 3600), maxHours: 5 });
  assert.equal(r.measuredHours, 2);
  assert.equal(r.ceiling, 2);
  assert.equal(r.credited, 2);
});

test("credited never exceeds maxHours (measured above cap)", () => {
  // 8h measured but cap is 5h → ceiling and credited clamp to 5h.
  const r = computeCreditedHours({ measuredSeconds: h(8 * 3600), maxHours: 5 });
  assert.equal(r.measuredHours, 8);
  assert.equal(r.ceiling, 5);
  assert.equal(r.credited, 5);
});

test("measured exactly at cap → credited equals cap", () => {
  const r = computeCreditedHours({ measuredSeconds: h(5 * 3600), maxHours: 5 });
  assert.equal(r.credited, 5);
});

test("reviewer can only REDUCE: requested below the ceiling lowers credited", () => {
  // Ceiling is min(3h measured, 5h cap) = 3h. Reviewer requests 1.5h → credited 1.5h.
  const r = computeCreditedHours({ measuredSeconds: h(3 * 3600), requestedHours: 1.5, maxHours: 5 });
  assert.equal(r.ceiling, 3);
  assert.equal(r.credited, 1.5);
});

test("reviewer CANNOT credit above measured time: requested above ceiling is clamped", () => {
  // Measured 2h is the binding constraint; a reviewer asking for 10h is clamped to 2h.
  const r = computeCreditedHours({ measuredSeconds: h(2 * 3600), requestedHours: 10, maxHours: 5 });
  assert.equal(r.ceiling, 2);
  assert.equal(r.credited, 2);
});

test("reviewer cannot exceed the cap either: requested above cap clamps to cap", () => {
  // Measured 9h, cap 5h, reviewer asks 9h → clamped to the 5h cap.
  const r = computeCreditedHours({ measuredSeconds: h(9 * 3600), requestedHours: 9, maxHours: 5 });
  assert.equal(r.ceiling, 5);
  assert.equal(r.credited, 5);
});

test("requested omitted → volunteer credited the full ceiling", () => {
  const below = computeCreditedHours({ measuredSeconds: h(2 * 3600), maxHours: 5 });
  assert.equal(below.credited, below.ceiling);
  const above = computeCreditedHours({ measuredSeconds: h(9 * 3600), maxHours: 5 });
  assert.equal(above.credited, above.ceiling);
  assert.equal(above.credited, 5);
});

test("negative requested floors at 0 (no negative credit)", () => {
  const r = computeCreditedHours({ measuredSeconds: h(3 * 3600), requestedHours: -4, maxHours: 5 });
  assert.equal(r.credited, 0);
});

test("zero measured time → zero credited regardless of request", () => {
  const r = computeCreditedHours({ measuredSeconds: 0, requestedHours: 5, maxHours: 5 });
  assert.equal(r.measuredHours, 0);
  assert.equal(r.ceiling, 0);
  assert.equal(r.credited, 0);
});

test("missing measuredSeconds is treated as 0 (no credit from nothing)", () => {
  const r = computeCreditedHours({ measuredSeconds: undefined as unknown as number, maxHours: 5 });
  assert.equal(r.credited, 0);
});

test("fractional measured time is preserved (no rounding away of partial hours)", () => {
  // 90 minutes = 1.5h, under a 5h cap.
  const r = computeCreditedHours({ measuredSeconds: 90 * 60, maxHours: 5 });
  assert.equal(r.measuredHours, 1.5);
  assert.equal(r.credited, 1.5);
});
