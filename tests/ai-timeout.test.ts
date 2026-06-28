import { test } from "node:test";
import assert from "node:assert";
import { validateSubmission, AI_FALLBACK } from "@/lib/ai";
import { verifyBenefitsCalScreenshot } from "@/lib/benefitscal";

/*
 * RESILIENCE — model/auth fetches must degrade to the manual-review fallback
 * (never auto-approve) when the upstream hangs, times out, or errors. These
 * stub global fetch so they run with no network and no API round-trip.
 */

function withStubbedFetch<T>(stub: typeof fetch, fn: () => Promise<T>): Promise<T> {
  const orig = globalThis.fetch;
  globalThis.fetch = stub;
  return fn().finally(() => {
    globalThis.fetch = orig;
  });
}

const baseInput = {
  rubric: "count trees",
  submissionText: "I counted 12 trees",
  images: [],
  apiKey: "test-key",
};

/**
 * A fetch that never resolves on its own and only rejects when the caller's
 * AbortSignal fires. This proves the production `signal: AbortSignal.timeout(...)`
 * is actually wired: without the signal, `sawSignal` stays false and the promise
 * would hang forever. A ref'd timer keeps the event loop alive (AbortSignal's
 * own timer is unref'd), so the test settles fast and deterministically.
 */
function neverResolvingFetch(state: { sawSignal: boolean }): typeof fetch {
  return ((_url: string, init?: { signal?: AbortSignal }) =>
    new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      state.sawSignal = signal != null;
      // Keep the loop alive; without this an unref'd AbortSignal timer lets the
      // process exit before the abort ever fires.
      const keepAlive = setTimeout(() => {}, 60_000);
      if (!signal) return; // no signal → genuinely never settles (hang)
      const onAbort = () => {
        clearTimeout(keepAlive);
        reject(signal.reason);
      };
      if (signal.aborted) return onAbort();
      signal.addEventListener("abort", onAbort, { once: true });
    })) as unknown as typeof fetch;
}

test("validateSubmission: a fetch that never resolves on its own → AI_FALLBACK", async () => {
  // The stub hangs until the AbortSignal fires; we shorten the production 20s
  // fuse to 20ms for the duration of the call so the test is fast while still
  // exercising the real timeout/abort → manual-review path.
  const state = { sawSignal: false };
  const stub = neverResolvingFetch(state);
  const origTimeout = AbortSignal.timeout.bind(AbortSignal);
  AbortSignal.timeout = ((_ms: number) => origTimeout(20)) as typeof AbortSignal.timeout;
  try {
    const v = await withStubbedFetch(stub, () => validateSubmission(baseInput));
    assert.ok(state.sawSignal, "production fetch must pass an AbortSignal");
    assert.deepEqual(v, AI_FALLBACK);
    // A hang must never become an auto-approve.
    assert.notStrictEqual(v.verdict, "approve");
  } finally {
    AbortSignal.timeout = origTimeout;
  }
});

test("validateSubmission: a TimeoutError-throwing fetch → AI_FALLBACK (manual review)", async () => {
  const stub = (async () => {
    const err = new Error("The operation was aborted");
    err.name = "TimeoutError";
    throw err;
  }) as unknown as typeof fetch;
  const v = await withStubbedFetch(stub, () => validateSubmission(baseInput));
  assert.deepEqual(v, AI_FALLBACK);
  // Critical: a timeout must never become an auto-approve.
  assert.notStrictEqual(v.verdict, "approve");
});

test("validateSubmission: non-2xx upstream → AI_FALLBACK (manual review)", async () => {
  const stub = (async () =>
    new Response("rate limited", { status: 429 })) as unknown as typeof fetch;
  const v = await withStubbedFetch(stub, () => validateSubmission(baseInput));
  assert.equal(v.verdict, "flag");
  assert.equal(v.confidence, 0);
  assert.match(v.reasoning, /manual review/i);
});

test("verifyBenefitsCalScreenshot: no API key → manual review (never verified)", async () => {
  const r = await verifyBenefitsCalScreenshot({ r2Key: "verification/x/benefitscal.png" });
  assert.strictEqual(r.verified, false);
  assert.strictEqual(r.confidence, 0);
  assert.match(r.reasoning, /manual review/i);
});
