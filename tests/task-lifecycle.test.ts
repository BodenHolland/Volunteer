import { test } from "node:test";
import assert from "node:assert";
import { isTaskCommittable } from "@/lib/queries";

// ---------- Task-lifecycle commit gate (H11) ----------
//
// isTaskCommittable is the pure core of the server-side guard that
// commitToTask runs before inserting a submission. It rejects committing to a
// task that isn't 'active', has passed its closes_at deadline, or is a
// directory-only external listing.

const NOW = 1_000_000;
const base = { status: "active", closes_at: null as number | null, listing_type: "native" };

test("isTaskCommittable allows an active, open, native task", () => {
  assert.equal(isTaskCommittable(base, NOW), true);
  // Open in the future is fine.
  assert.equal(isTaskCommittable({ ...base, closes_at: NOW + 1000 }, NOW), true);
});

test("isTaskCommittable rejects non-active statuses", () => {
  for (const status of ["draft", "paused", "archived"]) {
    assert.equal(isTaskCommittable({ ...base, status }, NOW), false);
  }
});

test("isTaskCommittable rejects a task past its closes_at deadline", () => {
  assert.equal(isTaskCommittable({ ...base, closes_at: NOW - 1 }, NOW), false);
  // Exactly at closes_at is closed (deadline inclusive).
  assert.equal(isTaskCommittable({ ...base, closes_at: NOW }, NOW), false);
});

test("isTaskCommittable rejects directory-only external listings", () => {
  assert.equal(isTaskCommittable({ ...base, listing_type: "external" }, NOW), false);
});

test("isTaskCommittable accepts native citizen-science certificate tasks", () => {
  // Zooniverse-style tasks are listing_type 'native' (evidence_mode differs),
  // so the gate must admit them.
  assert.equal(isTaskCommittable({ status: "active", closes_at: null, listing_type: "native" }, NOW), true);
});
