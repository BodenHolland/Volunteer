import { test } from "node:test";
import assert from "node:assert";
import {
  secondsToHours,
  MIN_ENGAGEMENT_SECONDS,
  ACTIVITY_IDLE_THRESHOLD_MS,
} from "@/lib/engagement";

test("ACTIVITY_IDLE_THRESHOLD_MS is 60000 (60s of no interaction → idle)", () => {
  assert.equal(ACTIVITY_IDLE_THRESHOLD_MS, 60_000);
});

test("MIN_ENGAGEMENT_SECONDS is 60", () => {
  assert.equal(MIN_ENGAGEMENT_SECONDS, 60);
});

test("secondsToHours: edge cases 0, 3600, 5400", () => {
  assert.equal(secondsToHours(0), 0);
  assert.equal(secondsToHours(3600), 1);
  assert.equal(secondsToHours(5400), 1.5);
});
