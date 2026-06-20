import { test } from "node:test";
import assert from "node:assert";
import { parseJson, totalLoggedHours, type TimeLogSession } from "@/lib/types";

test("parseJson: valid JSON parses to the typed value", () => {
  assert.deepEqual(parseJson<{ a: number }>('{"a":1}', { a: 0 }), { a: 1 });
  assert.deepEqual(parseJson<number[]>("[1,2,3]", []), [1, 2, 3]);
});

test("parseJson: invalid JSON returns the fallback", () => {
  assert.deepEqual(parseJson("{not json}", { ok: true }), { ok: true });
  assert.deepEqual(parseJson("undefined", []), []);
});

test("parseJson: null / undefined / empty returns the fallback", () => {
  assert.deepEqual(parseJson(null, { x: 1 }), { x: 1 });
  assert.deepEqual(parseJson(undefined, []), []);
  assert.deepEqual(parseJson("", "fallback"), "fallback");
});

// Note: timestamps are real epoch-ms (always large). The lib guards with
// `s.end && s.start`, which would drop a session whose start is literally 0 —
// a non-issue in production since epoch-0 starts never occur.
const T0 = 1_700_000_000_000;

test("totalLoggedHours: sums closed sessions and converts ms → hours", () => {
  const log: TimeLogSession[] = [
    { start: T0, end: T0 + 3_600_000 }, // 1h
    { start: T0 + 10_000_000, end: T0 + 10_000_000 + 1_800_000 }, // 0.5h
  ];
  assert.equal(totalLoggedHours(log), 1.5);
});

test("totalLoggedHours: ignores open (null end) sessions", () => {
  const log: TimeLogSession[] = [
    { start: T0, end: T0 + 3_600_000 }, // 1h
    { start: T0 + 5_000_000, end: null }, // open, ignored
  ];
  assert.equal(totalLoggedHours(log), 1);
});

test("totalLoggedHours: empty log is zero", () => {
  assert.equal(totalLoggedHours([]), 0);
});

test("totalLoggedHours: a single 90-minute session is 1.5h", () => {
  assert.equal(totalLoggedHours([{ start: T0, end: T0 + 5_400_000 }]), 1.5);
});
