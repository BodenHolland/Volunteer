import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Cloudflare bindings + env vars, available in server components/actions/routes. */
export function getEnv(): CloudflareEnv {
  return getCloudflareContext().env;
}

export function getDb(): D1Database {
  return getCloudflareContext().env.DB;
}

export function getFiles(): R2Bucket {
  return getCloudflareContext().env.FILES;
}

/**
 * True ONLY in an explicit unit-test run. Detected from signals the test
 * runner sets itself, never inferred from a missing Cloudflare context:
 *
 *   - `process.env.NODE_TEST_CONTEXT` — set automatically by Node's built-in
 *     test runner (`node:test` / `node --test`, which is how `pnpm test` runs
 *     via `tsx --test`). This is the reliable primary signal: present during
 *     every test execution, absent in dev/build/production.
 *   - `process.env.NODE_ENV === "test"` and `process.env.TENDED_TEST === "1"`
 *     — explicit opt-ins for any other test harness.
 *
 * This gate exists so the crypto helpers may pass plaintext through *only* in
 * tests (which run with no PII_ENCRYPTION_KEY by design). It must never be true
 * in a real runtime, so it deliberately does not consult the Cloudflare env.
 */
export function isTestRun(): boolean {
  const env = typeof process !== "undefined" ? process.env : undefined;
  if (!env) return false;
  return (
    typeof env.NODE_TEST_CONTEXT === "string" ||
    env.NODE_ENV === "test" ||
    env.TENDED_TEST === "1"
  );
}

/**
 * True only when `DEMO_MODE=true`. Enables sample-data seeding, the /admin/reset
 * tool, and onboarding skips. Unset (off) in production so none of that
 * scaffolding is reachable and PII encryption is required.
 *
 * IMPORTANT (fail-closed): when the Cloudflare context is unavailable, getEnv()
 * throws. We must NOT infer demo mode from that — doing so would silently
 * downgrade PII encryption to plaintext in any runtime where the context isn't
 * yet initialized. Demo mode is an EXPLICIT flag only; without a readable env we
 * return false (the secure default) and let the test gate (isTestRun) handle the
 * narrow no-key test path.
 */
export function isDemoMode(): boolean {
  try {
    return (getEnv() as unknown as { DEMO_MODE?: string }).DEMO_MODE === "true";
  } catch {
    return false;
  }
}
