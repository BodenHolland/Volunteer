/**
 * Dependency-free, in-memory fixed-window rate limiter.
 *
 * Keyed by an arbitrary string (e.g. `login:ip:1.2.3.4` or `login:email:a@b.c`).
 * Each key tracks a window start + a hit count; once the window elapses the
 * counter resets.
 *
 * NOTE (production): this state lives in a module-level Map and is therefore
 * per-isolate — on Cloudflare Workers each isolate has its own copy and isolates
 * are ephemeral, so this is best-effort only and fine for a demo. A real
 * deployment should back this with a Durable Object or KV (atomic, shared across
 * isolates) so the window is globally consistent.
 */

interface Window {
  /** Epoch ms when the current window started. */
  start: number;
  /** Hits recorded in the current window. */
  count: number;
}

const buckets = new Map<string, Window>();

// Opportunistic cleanup bound so the Map can't grow without limit under churn.
const MAX_KEYS = 10_000;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
}

/**
 * Record a hit against `key` and report whether it's within `limit` for the
 * current `windowMs`-sized window.
 *
 * @returns ok=false once the limit is exceeded; remaining is how many hits are
 *          left in the window (0 when blocked).
 */
export function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = Date.now();
  let w = buckets.get(key);

  if (!w || now - w.start >= windowMs) {
    // Fresh window.
    w = { start: now, count: 0 };
    buckets.set(key, w);
  }

  w.count += 1;

  // Best-effort eviction of an arbitrary stale entry to cap memory.
  if (buckets.size > MAX_KEYS) {
    for (const [k, v] of buckets) {
      if (now - v.start >= windowMs) buckets.delete(k);
      if (buckets.size <= MAX_KEYS) break;
    }
  }

  const ok = w.count <= limit;
  const remaining = Math.max(0, limit - w.count);
  return Promise.resolve({ ok, remaining });
}
