import { getDb } from "./cf";

/** A single audit-log row joined to the actor's display identity. */
export interface AuditRow {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  detail_json: string | null;
  created_at: number;
  actor_name: string | null;
  actor_email: string | null;
}

/**
 * Latest audit_log rows, newest first. Optionally filtered to a single action.
 * Joins users so the viewer sees a human actor, not a raw id.
 */
export async function getRecentAudit(limit = 200, action?: string): Promise<AuditRow[]> {
  const db = getDb();
  const base = `SELECT a.id, a.actor_user_id, a.action, a.entity_type, a.entity_id,
      a.detail_json, a.created_at,
      u.full_name AS actor_name, u.email AS actor_email
    FROM audit_log a
    LEFT JOIN users u ON u.id = a.actor_user_id`;
  if (action) {
    return (
      (await db
        .prepare(`${base} WHERE a.action = ? ORDER BY a.created_at DESC LIMIT ?`)
        .bind(action, limit)
        .all<AuditRow>()).results ?? []
    );
  }
  return (
    (await db
      .prepare(`${base} ORDER BY a.created_at DESC LIMIT ?`)
      .bind(limit)
      .all<AuditRow>()).results ?? []
  );
}

/** A credited-hours violation: an approved submission credited above its measured time. */
export interface InvariantViolation {
  id: string;
  hours_credited: number;
  measured_active_seconds: number;
  measured_hours: number;
  title: string | null;
  full_name: string | null;
}

/**
 * Hard line #1 monitor. Returns approved submissions where credited hours
 * exceed measured active time (with a small epsilon for float/rounding slack).
 * An empty list means the invariant holds: credited never exceeds measured.
 */
export async function getInvariantViolations(): Promise<InvariantViolation[]> {
  // 1 second of slack, expressed in hours, to absorb float rounding.
  const EPSILON_HOURS = 1 / 3600;
  const rows =
    (await getDb()
      .prepare(
        `SELECT s.id, s.hours_credited, s.measured_active_seconds,
           t.title AS title, u.full_name AS full_name
         FROM submissions s
         JOIN task_templates t ON t.id = s.task_template_id
         JOIN users u ON u.id = s.user_id
         WHERE s.status = 'approved'
           AND s.hours_credited IS NOT NULL
           AND s.hours_credited > (s.measured_active_seconds / 3600.0) + ?
         ORDER BY s.hours_credited DESC`
      )
      .bind(EPSILON_HOURS)
      .all<{
        id: string;
        hours_credited: number;
        measured_active_seconds: number;
        title: string | null;
        full_name: string | null;
      }>()).results ?? [];
  return rows.map((r) => ({
    id: r.id,
    hours_credited: r.hours_credited,
    measured_active_seconds: r.measured_active_seconds,
    measured_hours: (r.measured_active_seconds ?? 0) / 3600,
    title: r.title,
    full_name: r.full_name,
  }));
}

/** A gate violation: a task marked active without a completed 4-part gate review. */
export interface GateViolation {
  id: string;
  title: string;
  org_name: string | null;
}

/**
 * Hard line #2 monitor. Returns 'active' task templates that have no
 * gate_reviewed_at — i.e. shipped without passing the 4-part beneficiary gate.
 * Should always be empty.
 */
export async function getGateViolations(): Promise<GateViolation[]> {
  return (
    (await getDb()
      .prepare(
        `SELECT t.id, t.title, o.name AS org_name
         FROM task_templates t
         LEFT JOIN orgs o ON o.id = t.org_id
         WHERE t.status = 'active' AND t.gate_reviewed_at IS NULL
         ORDER BY t.created_at DESC`
      )
      .all<GateViolation>()).results ?? []
  );
}

/** Count of submissions currently stuck in AI review (queue-backlog proxy). */
export async function getAiBacklog(): Promise<number> {
  const row = await getDb()
    .prepare("SELECT COUNT(*) AS n FROM submissions WHERE status = 'ai_reviewing'")
    .first<{ n: number }>();
  return row?.n ?? 0;
}
