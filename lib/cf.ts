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
    return false;
  }
}
