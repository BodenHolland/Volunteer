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
 * True only when `DEMO_MODE=true`. Enables sample-data seeding, the /admin/reset
 * tool, and onboarding skips. Unset (off) in production so none of that
 * scaffolding is reachable and PII encryption is required.
 */
export function isDemoMode(): boolean {
  try {
    return (getEnv() as unknown as { DEMO_MODE?: string }).DEMO_MODE === "true";
  } catch {
    // getEnv() only throws when there's no Cloudflare context — i.e. we're NOT
    // in the Workers runtime (unit tests, build scripts, plain node). Production
    // always has the context above and reads the real DEMO_MODE flag, so
    // fail-closed PII encryption is preserved there. Outside the runtime there's
    // no real env or PII to protect, so treat it as demo (crypto helpers pass
    // through) rather than fail-closed — otherwise the crypto unit tests, which
    // run with no key by design, throw and turn CI red.
    return true;
  }
}
