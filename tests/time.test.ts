import { test } from "node:test";
import assert from "node:assert";
import {
  relativeTime,
  formatHours,
  monthLabel,
  currentMonth,
  formatDob,
} from "@/lib/time";

test("relativeTime: buckets across the time scale", () => {
  const now = 1_700_000_000_000;
  assert.equal(relativeTime(now, now), "just now");
  assert.equal(relativeTime(now - 30 * 1000, now), "just now");
  assert.equal(relativeTime(now - 5 * 60 * 1000, now), "5m ago");
  assert.equal(relativeTime(now - 3 * 60 * 60 * 1000, now), "3h ago");
  assert.equal(relativeTime(now - 2 * 24 * 60 * 60 * 1000, now), "2d ago");
  assert.equal(relativeTime(now - 90 * 24 * 60 * 60 * 1000, now), "3mo ago");
});

test("relativeTime: future timestamps clamp to 'just now'", () => {
  const now = 1_700_000_000_000;
  assert.equal(relativeTime(now + 60 * 1000, now), "just now");
});

test("formatHours: rounds to one decimal, drops trailing .0", () => {
  assert.equal(formatHours(2), "2");
  assert.equal(formatHours(2.0), "2");
  assert.equal(formatHours(2.5), "2.5");
  assert.equal(formatHours(2.04), "2");
  assert.equal(formatHours(2.05), "2.1");
  assert.equal(formatHours(0), "0");
});

test("monthLabel: 'YYYY-MM' → 'Month YYYY'", () => {
  assert.equal(monthLabel("2026-06"), "June 2026");
  assert.equal(monthLabel("2026-01"), "January 2026");
  assert.equal(monthLabel("2025-12"), "December 2025");
});

test("currentMonth: returns UTC YYYY-MM", () => {
  // 2026-06-19 (mid-month UTC)
  assert.equal(currentMonth(Date.UTC(2026, 5, 19, 12, 0, 0)), "2026-06");
  // January is zero-padded
  assert.equal(currentMonth(Date.UTC(2026, 0, 5)), "2026-01");
});

test("formatDob: 'YYYY-MM-DD' → 'Month D, YYYY'", () => {
  assert.equal(formatDob("1990-03-04"), "March 4, 1990");
  assert.equal(formatDob("2000-12-31"), "December 31, 2000");
});

test("formatDob: null / empty / malformed inputs", () => {
  assert.equal(formatDob(null), "");
  assert.equal(formatDob(""), "");
  assert.equal(formatDob("not-a-date"), "not-a-date");
});
