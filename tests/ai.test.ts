import { test } from "node:test";
import assert from "node:assert";
import { coerceVerdict, validateSubmission, AI_FALLBACK, type AiVerdict } from "@/lib/ai";

/**
 * AI FALLBACK — the validator must NEVER let untrusted/garbage upstream output
 * drive an unsafe verdict, and must degrade to manual review (AI_FALLBACK) on
 * any transport failure. A malformed/hostile payload must always coerce to a
 * fully-typed verdict that defaults to the SAFE side ("flag" → human review),
 * never silently to "approve".
 */

function assertWellFormed(v: AiVerdict) {
  assert.ok(["approve", "flag", "reject"].includes(v.verdict), `bad verdict: ${v.verdict}`);
  assert.equal(typeof v.confidence, "number");
  assert.ok(v.confidence >= 0 && v.confidence <= 1, `confidence out of range: ${v.confidence}`);
  assert.equal(typeof v.reasoning, "string");
  assert.ok(Array.isArray(v.issues));
  assert.equal(typeof v.estimated_actual_hours, "number");
  assert.equal(typeof v.suspected_ai_content, "boolean");
}

test("coerceVerdict: null / undefined → safe typed 'flag' verdict", () => {
  for (const input of [null, undefined]) {
    const v = coerceVerdict(input);
    assertWellFormed(v);
    assert.equal(v.verdict, "flag"); // unknown defaults to the safe side
    assert.equal(v.confidence, 0);
  }
});

test("coerceVerdict: garbage primitives never throw and stay safe", () => {
  for (const input of [42, "not json", true, [], Symbol.iterator]) {
    const v = coerceVerdict(input as unknown);
    assertWellFormed(v);
    assert.equal(v.verdict, "flag");
  }
});

test("coerceVerdict: an unknown verdict string is forced to 'flag'", () => {
  const v = coerceVerdict({ verdict: "definitely-approve", confidence: 0.99 });
  assert.equal(v.verdict, "flag");
  assertWellFormed(v);
});

test("coerceVerdict: a valid 'approve' is preserved, confidence clamped", () => {
  const v = coerceVerdict({ verdict: "approve", confidence: 5 });
  assert.equal(v.verdict, "approve");
  assert.equal(v.confidence, 1); // clamped into [0,1]
});

test("coerceVerdict: negative confidence clamps to 0", () => {
  const v = coerceVerdict({ verdict: "reject", confidence: -3 });
  assert.equal(v.verdict, "reject");
  assert.equal(v.confidence, 0);
});

test("coerceVerdict: non-string reasoning / non-array issues are normalized", () => {
  const v = coerceVerdict({ verdict: "approve", reasoning: 123, issues: "nope", estimated_actual_hours: "10" });
  assertWellFormed(v);
  assert.equal(v.reasoning, "No reasoning provided.");
  assert.deepEqual(v.issues, []);
  assert.equal(v.estimated_actual_hours, 0); // non-number → 0
});

test("coerceVerdict: issues array of mixed types is coerced to strings", () => {
  const v = coerceVerdict({ verdict: "flag", issues: ["ok", 7, null, { a: 1 }] });
  assert.ok(v.issues.every((i) => typeof i === "string"));
  assert.equal(v.issues.length, 4);
});

test("coerceVerdict: malformed field_issues are filtered and field names normalized", () => {
  const v = coerceVerdict({
    verdict: "flag",
    field_issues: [
      { field: "photos", message: "blurry" },
      { field: "bogus", message: "weird field name" }, // → normalized to "overall"
      { field: "notes" }, // no message → dropped
      "garbage", // not an object → dropped
    ],
  });
  assert.ok(v.field_issues);
  assert.equal(v.field_issues!.length, 2);
  assert.equal(v.field_issues![0].field, "photos");
  assert.equal(v.field_issues![1].field, "overall");
});

test("coerceVerdict: suspected_ai_content only true on strict boolean true", () => {
  assert.equal(coerceVerdict({ verdict: "flag", suspected_ai_content: "true" }).suspected_ai_content, false);
  assert.equal(coerceVerdict({ verdict: "flag", suspected_ai_content: 1 }).suspected_ai_content, false);
  assert.equal(coerceVerdict({ verdict: "flag", suspected_ai_content: true }).suspected_ai_content, true);
});

test("coerceVerdict: markdown-fenced JSON is the caller's job — raw fenced string stays safe", () => {
  // coerceVerdict receives already-parsed objects; a stray string still coerces safely.
  const v = coerceVerdict("```json\n{\"verdict\":\"approve\"}\n```");
  assert.equal(v.verdict, "flag");
});

/* ---- validateSubmission transport-failure fallback (global fetch stubbed) ---- */

const baseInput = {
  rubric: "count trees",
  submissionText: "I counted 12 trees",
  images: [],
  apiKey: "test-key",
};

function withStubbedFetch<T>(stub: typeof fetch, fn: () => Promise<T>): Promise<T> {
  const orig = globalThis.fetch;
  globalThis.fetch = stub;
  return fn().finally(() => {
    globalThis.fetch = orig;
  });
}

test("validateSubmission: no API key → AI_FALLBACK (manual review)", async () => {
  const v = await validateSubmission({ ...baseInput, apiKey: undefined });
  assert.deepEqual(v, AI_FALLBACK);
});

test("validateSubmission: non-2xx upstream → AI_FALLBACK (manual review)", async () => {
  const stub = (async () =>
    new Response("rate limited", { status: 429 })) as unknown as typeof fetch;
  const v = await withStubbedFetch(stub, () => validateSubmission(baseInput));
  assert.equal(v.verdict, "flag");
  assert.equal(v.confidence, 0);
  assert.match(v.reasoning, /manual review/i);
});

test("validateSubmission: a thrown/timeout fetch → AI_FALLBACK (manual review)", async () => {
  const stub = (async () => {
    const err = new Error("The operation was aborted");
    err.name = "TimeoutError";
    throw err;
  }) as unknown as typeof fetch;
  const v = await withStubbedFetch(stub, () => validateSubmission(baseInput));
  assert.deepEqual(v, AI_FALLBACK);
});

test("validateSubmission: a 200 with non-JSON body falls back safely", async () => {
  const stub = (async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: "totally not json" } }] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as unknown as typeof fetch;
  const v = await withStubbedFetch(stub, () => validateSubmission(baseInput));
  assert.deepEqual(v, AI_FALLBACK);
});

test("validateSubmission: a 200 with valid fenced JSON is parsed & coerced", async () => {
  const content = "```json\n" + JSON.stringify({ verdict: "approve", confidence: 0.9 }) + "\n```";
  const stub = (async () =>
    new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as unknown as typeof fetch;
  const v = await withStubbedFetch(stub, () => validateSubmission(baseInput));
  assert.equal(v.verdict, "approve");
  assert.equal(v.confidence, 0.9);
});
