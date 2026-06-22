/**
 * D1-backed fixed-window rate limiter.
 *
 * Keyed by an arbitrary string (e.g. `login:ip:1.2.3.4` or `login:email:a@b.c`).
 * Each key tracks a window start + a hit count; once the window elapses the
 * counter resets.
 *
 * The upsert is atomic in SQLite, so the counter is shared across Worker
 * isolates. This deliberately favors correctness over a tiny amount of D1 work
 * on protected endpoints.
 */
import { getDb } from "./cf";

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
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const safeKey = key.slice(0, 256);

  return getDb()
    .prepare(
      `INSERT INTO rate_limits (key, window_started_at, count)
       VALUES (?, ?, 1)
       ON CONFLICT(key) DO UPDATE SET
         window_started_at = CASE
           WHEN rate_limits.window_started_at < excluded.window_started_at THEN excluded.window_started_at
           ELSE rate_limits.window_started_at
         END,
         count = CASE
           WHEN rate_limits.window_started_at < excluded.window_started_at THEN 1
           ELSE rate_limits.count + 1
         END
       RETURNING count`
    )
    .bind(safeKey, windowStart)
    .first<{ count: number }>()
    .then((row) => {
      const count = row?.count ?? limit + 1;
      return { ok: count <= limit, remaining: Math.max(0, limit - count) };
    });
}
