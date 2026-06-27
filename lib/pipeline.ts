/**
 * Shared "do work → review → credit hours" pipeline contract.
 *
 * The three pipelines (generic task submissions, food-access store audits,
 * government-website audits) each repeat the same cross-cutting skeleton:
 * validate → build flags → route to a terminal status → credit hours → publish
 * a public-cluster row. The DOMAIN logic stays in each pipeline (generic
 * text+image review, food-audit per-item vision, gov-audit browser checks); this
 * module holds only the pieces that are genuinely identical so they live in one
 * place and can be unit-tested.
 *
 * What lives here:
 *  - `PendingFlag` — the single flag shape used by BOTH audit pipelines
 *    (previously declared twice, in lib/audit-pipeline.ts and lib/food-audit.ts).
 *  - `routePendingFlags` — the block/review → terminal-status decision shared by
 *    the audit pipelines (block ⇒ rejected, any open flag ⇒ flagged, else
 *    verified). The generic-submission routing (`routeStatus` in lib/fraud.ts)
 *    is a different state machine and stays where it is.
 *  - `pendingFlagInsertStmts` — builds the `audit_validation_flags` INSERT
 *    statements for a batch of `PendingFlag`s so callers don't re-spell the SQL.
 *
 * NOTE: `FraudFlag` (lib/fraud.ts) and `PendingFlag` are deliberately NOT
 * unified — they are different domain shapes (FraudFlag: kind + warn/flag/block
 * severity for generic submissions; PendingFlag: flag_type + block/review for
 * audits, with a human-readable reason and metadata). Forcing them together
 * would change observable persistence (different tables, different columns).
 */

import { newId } from "./ids";

/**
 * A flag produced by an audit pipeline, pending persistence into
 * `audit_validation_flags`. Canonical home for the type that food-audit.ts and
 * audit-pipeline.ts each used to declare independently.
 */
export interface PendingFlag {
  flag_type: string;
  /** 'block' is terminal (→ rejected); 'review' routes to human spot-review. */
  flag_severity: "block" | "review";
  flag_reason: string;
  metadata?: unknown;
}

/** Terminal status for an audit-style pipeline. */
export type AuditTerminalStatus = "verified" | "flagged" | "rejected";

/**
 * Shared block/review → terminal-status routing for the audit pipelines.
 *  - any block-severity flag ⇒ rejected
 *  - otherwise any flag (new or pre-existing) ⇒ flagged (human spot-review)
 *  - clean ⇒ verified (auto-credit)
 *
 * `priorFlagCount` covers flags already attached to the audit on a prior pass
 * (e.g. sync-validation flags recorded at submit time).
 */
export function routePendingFlags(
  pendingFlags: PendingFlag[],
  priorFlagCount = 0
): { status: AuditTerminalStatus; totalFlags: number } {
  const totalFlags = priorFlagCount + pendingFlags.length;
  if (pendingFlags.some((f) => f.flag_severity === "block")) {
    return { status: "rejected", totalFlags };
  }
  if (totalFlags > 0) return { status: "flagged", totalFlags };
  return { status: "verified", totalFlags };
}

/**
 * Build the `audit_validation_flags` INSERT statements for a batch of pending
 * flags. Returns prepared, bound statements so callers can either run them
 * individually or drop them into a `db.batch([...])`. `now` is threaded in so a
 * whole batch shares one timestamp.
 */
export function pendingFlagInsertStmts(
  db: D1Database,
  auditId: string,
  flags: PendingFlag[],
  now: number = Date.now()
): D1PreparedStatement[] {
  return flags.map((f) =>
    db
      .prepare(
        `INSERT INTO audit_validation_flags
         (id, audit_id, flag_type, flag_severity, flag_reason, flag_metadata_json, created_at, resolution_status)
         VALUES (?,?,?,?,?,?,?, 'open')`
      )
      .bind(
        newId("flag"),
        auditId,
        f.flag_type,
        f.flag_severity,
        f.flag_reason,
        f.metadata ? JSON.stringify(f.metadata) : null,
        now
      )
  );
}
