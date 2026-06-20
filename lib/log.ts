/**
 * Tiny structured logger for observability.
 *
 * Emits a single JSON line per call so logs are greppable and machine-parseable
 * (e.g. in Cloudflare Workers tail / Logpush). Keep this dependency-free.
 */
export function logEvent(event: string, fields?: Record<string, unknown>): void {
  try {
    console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...fields }));
  } catch {
    // Never let logging break the request flow.
    console.log(JSON.stringify({ ts: new Date().toISOString(), event }));
  }
}
