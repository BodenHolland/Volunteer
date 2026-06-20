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
