/**
 * Retention / expiry sweep (L2).
 *
 * Deletes rows that have outlived their usefulness from four short-lived
 * tables, so they don't accumulate forever in D1:
 *   - rate_limits   — fixed-window counters; a window older than the longest
 *                     limiter window is dead weight.
 *   - sessions      — server-side sessions past their expires_at.
 *   - auth_tokens   — email-verify / password-reset tokens past expires_at
 *                     (also covers already-used tokens, which carry expires_at).
 *   - audit_log     — operational log, kept for a bounded retention window.
 *
 * Dry-run-safe: pass { dryRun: true } (the default) to COUNT what would be
 * deleted without touching anything. The cron passes { dryRun: false }.
 *
 * Pure-ish: reads `now` as a parameter so it's testable, and returns a
 * per-table breakdown the caller (cron route, /api/health, an admin tool) can
 * report.
 */
import { getDb } from "./cf";

/** How long an audit_log row is retained before the sweep removes it. */
export const AUDIT_LOG_RETENTION_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

/**
 * How long a rate_limits window row lingers after its window start before it's
 * considered dead. Generous so it never races a still-active limiter window
 * (the longest current window is ~15 min for login lockout).
 */
export const RATE_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1000; // 1 day

export interface SweepResult {
  dryRun: boolean;
  rate_limits: number;
  sessions: number;
  auth_tokens: number;
  audit_log: number;
  total: number;
}

interface SweepOptions {
  /** When true (default), only COUNT matching rows — never delete. */
  dryRun?: boolean;
  /** Injectable clock for tests. */
  now?: number;
}

export async function runSweep(opts: SweepOptions = {}): Promise<SweepResult> {
  const dryRun = opts.dryRun ?? true;
  const now = opts.now ?? Date.now();
  const db = getDb();

  const auditCutoff = now - AUDIT_LOG_RETENTION_MS;
  const rateCutoff = now - RATE_LIMIT_RETENTION_MS;

  // Each target: a WHERE clause + its binds. COUNT in dry-run, DELETE otherwise.
  const targets: Array<{ key: keyof Omit<SweepResult, "dryRun" | "total">; table: string; where: string; binds: number[] }> = [
    { key: "rate_limits", table: "rate_limits", where: "window_started_at < ?", binds: [rateCutoff] },
    { key: "sessions", table: "sessions", where: "expires_at < ?", binds: [now] },
    { key: "auth_tokens", table: "auth_tokens", where: "expires_at < ?", binds: [now] },
    { key: "audit_log", table: "audit_log", where: "created_at < ?", binds: [auditCutoff] },
  ];

  const result: SweepResult = {
    dryRun,
    rate_limits: 0,
    sessions: 0,
    auth_tokens: 0,
    audit_log: 0,
    total: 0,
  };

  for (const t of targets) {
    if (dryRun) {
      const row = await db
        .prepare(`SELECT COUNT(*) AS n FROM ${t.table} WHERE ${t.where}`)
        .bind(...t.binds)
        .first<{ n: number }>();
      result[t.key] = row?.n ?? 0;
    } else {
      const res = await db
        .prepare(`DELETE FROM ${t.table} WHERE ${t.where}`)
        .bind(...t.binds)
        .run();
      result[t.key] = res.meta.changes ?? 0;
    }
  }

  result.total = result.rate_limits + result.sessions + result.auth_tokens + result.audit_log;
  return result;
}
