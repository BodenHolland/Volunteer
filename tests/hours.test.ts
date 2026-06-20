import { test } from "node:test";
import assert from "node:assert";
import { secondsToHours, MIN_ENGAGEMENT_SECONDS } from "@/lib/engagement";

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
 * Credit rule (Change 4), replicated at the pure-function level:
 *   credited = approved ? min(measured, cap) : 0
 * The task estimate is a ceiling/flag only and must NEVER raise the credited
 * number above the volunteer's measured active time.
 */
function creditedHours(opts: {
  measured: number;
  cap: number;
  approved: boolean;
  estimate?: number; // intentionally ignored by the rule
}): number {
  if (!opts.approved) return 0;
  return Math.min(opts.measured, opts.cap);
}

test("credit rule: measured below cap → credited equals measured", () => {
  assert.equal(creditedHours({ measured: 2, cap: 5, approved: true }), 2);
});

test("credit rule: measured above cap → credited equals cap", () => {
  assert.equal(creditedHours({ measured: 8, cap: 5, approved: true }), 5);
});

test("credit rule: measured equals cap → credited equals cap", () => {
  assert.equal(creditedHours({ measured: 5, cap: 5, approved: true }), 5);
});

test("credit rule: rejected work → zero regardless of measured time", () => {
  assert.equal(creditedHours({ measured: 4, cap: 5, approved: false }), 0);
});

test("credit rule: a generous estimate never raises credited above measured", () => {
  // measured (1.5h) is the binding constraint even though estimate (10h) is huge.
  assert.equal(creditedHours({ measured: 1.5, cap: 5, approved: true, estimate: 10 }), 1.5);
});

test("credit rule: a generous estimate never raises credited above the cap", () => {
  assert.equal(creditedHours({ measured: 9, cap: 5, approved: true, estimate: 10 }), 5);
});
