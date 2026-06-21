import { test } from "node:test";
import assert from "node:assert";
import { nextTier, strictnessForTier, rollSample } from "@/lib/audit-trust";

test("tier 0 → tier 1 at 10 clean audits", () => {
  assert.strictEqual(
    nextTier({ prevTier: 0, auditsCompleted: 9, failedLast30Days: 0, tier1HeldDays: 0 }),
    0
  );
  assert.strictEqual(
    nextTier({ prevTier: 0, auditsCompleted: 10, failedLast30Days: 0, tier1HeldDays: 0 }),
    1
  );
});

test("tier 0 stays at 0 if any failed in last 30 days", () => {
  assert.strictEqual(
    nextTier({ prevTier: 0, auditsCompleted: 10, failedLast30Days: 1, tier1HeldDays: 0 }),
    0
  );
});

test("tier 1 → tier 2 at 30 completed AND 30 days held", () => {
  assert.strictEqual(
    nextTier({ prevTier: 1, auditsCompleted: 29, failedLast30Days: 0, tier1HeldDays: 31 }),
    1
  );
  assert.strictEqual(
    nextTier({ prevTier: 1, auditsCompleted: 30, failedLast30Days: 0, tier1HeldDays: 29 }),
    1
  );
  assert.strictEqual(
    nextTier({ prevTier: 1, auditsCompleted: 30, failedLast30Days: 0, tier1HeldDays: 30 }),
    2
  );
});

test("any tier demotes to 0 on 2+ failed audits in 30-day window", () => {
  assert.strictEqual(
    nextTier({ prevTier: 1, auditsCompleted: 100, failedLast30Days: 2, tier1HeldDays: 365 }),
    0
  );
  assert.strictEqual(
    nextTier({ prevTier: 2, auditsCompleted: 200, failedLast30Days: 3, tier1HeldDays: 365 }),
    0
  );
});

test("strictness scales with tier", () => {
  const t0 = strictnessForTier(0);
  const t1 = strictnessForTier(1);
  const t2 = strictnessForTier(2);
  assert.strictEqual(t0.ocrTolerance, 0.1);
  assert.strictEqual(t1.ocrTolerance, 0.15);
  assert.strictEqual(t2.ocrTolerance, 0.2);
  assert.strictEqual(t0.sampleRate, 1.0); // 100% spot-review at tier 0
  assert.strictEqual(t1.sampleRate, 0.1);
  assert.strictEqual(t2.sampleRate, 0.03);
});

test("rollSample is deterministic at 0 and 1", () => {
  for (let i = 0; i < 50; i++) {
    assert.strictEqual(rollSample(0), false);
    assert.strictEqual(rollSample(1), true);
  }
});

test("rollSample average roughly matches rate", () => {
  let hits = 0;
  const N = 5000;
  for (let i = 0; i < N; i++) if (rollSample(0.1)) hits++;
  const rate = hits / N;
  // generous tolerance — this is a statistical sanity check
  assert.ok(rate > 0.06 && rate < 0.14, `expected ~10%, got ${rate}`);
});
