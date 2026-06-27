import { test } from "node:test";
import assert from "node:assert";
import { routePendingFlags, type PendingFlag } from "@/lib/pipeline";

/**
 * ROUTING — the audit-pipeline block/review → terminal-status decision
 * (lib/pipeline.ts). This is the gate that decides whether an audit auto-credits
 * (`verified`), goes to human spot-review (`flagged`), or is killed (`rejected`).
 * The generic-submission routing (`routeStatus` in lib/fraud.ts) is a different
 * state machine and is covered in tests/fraud.test.ts.
 */

const flag = (severity: PendingFlag["flag_severity"], type = "t"): PendingFlag => ({
  flag_type: type,
  flag_severity: severity,
  flag_reason: `${type}/${severity}`,
});

test("clean (no flags) → verified, totalFlags 0", () => {
  const r = routePendingFlags([]);
  assert.equal(r.status, "verified");
  assert.equal(r.totalFlags, 0);
});

test("any block-severity flag → rejected (block is terminal)", () => {
  const r = routePendingFlags([flag("review"), flag("block")]);
  assert.equal(r.status, "rejected");
  assert.equal(r.totalFlags, 2);
});

test("a lone review flag → flagged (human spot-review)", () => {
  const r = routePendingFlags([flag("review")]);
  assert.equal(r.status, "flagged");
  assert.equal(r.totalFlags, 1);
});

test("block dominates regardless of order or count of review flags", () => {
  const r = routePendingFlags([flag("block"), flag("review"), flag("review")]);
  assert.equal(r.status, "rejected");
  assert.equal(r.totalFlags, 3);
});

test("priorFlagCount alone (no new flags) → flagged, count carried forward", () => {
  // No new flags this pass, but the audit already had flags from a prior pass:
  // it must NOT auto-verify — it routes to human review.
  const r = routePendingFlags([], 2);
  assert.equal(r.status, "flagged");
  assert.equal(r.totalFlags, 2);
});

test("priorFlagCount is added to the new flag count", () => {
  const r = routePendingFlags([flag("review")], 3);
  assert.equal(r.status, "flagged");
  assert.equal(r.totalFlags, 4);
});

test("priorFlagCount does NOT override a block → still rejected", () => {
  const r = routePendingFlags([flag("block")], 5);
  assert.equal(r.status, "rejected");
  assert.equal(r.totalFlags, 6);
});

test("zero prior + zero new → verified (the only auto-credit path)", () => {
  const r = routePendingFlags([], 0);
  assert.equal(r.status, "verified");
});
