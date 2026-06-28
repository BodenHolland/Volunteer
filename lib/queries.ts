import { getDb } from "./cf";
import {
  parseJson,
  totalLoggedHours,
  type Org,
  type Submission,
  type TaskTemplate,
  type User,
  type HoursLedgerRow,
  type TimeLogSession,
  type SubmissionFlagRow,
  type SubmissionFile,
} from "./types";
import { currentMonth } from "./time";

export interface SubmissionWithTask extends Submission {
  task: TaskTemplate;
  org: Org;
  /** Present when this committed task is a food audit (parallel `audits` row). */
  auditId?: string | null;
  /** The audit's own validation status (`draft|submitted|validating|verified|flagged|rejected`). */
  auditStatus?: string | null;
  /** Present when this committed task is a gov-website audit (parallel `gov_audit_sessions` row). */
  govAuditId?: string | null;
  /** The gov-audit session's status (`in_progress|submitted|finalized|flagged`). */
  govAuditStatus?: string | null;
}

/**
 * The correct detail route for a committed work item. Food audits and
 * gov-website audits each live in their own flow; generic tasks use the project
 * hub while active and the read-only submission view once submitted.
 */
export function workHref(s: SubmissionWithTask): string {
  if (s.auditId) return `/app/audits/${s.auditId}`;
  if (s.govAuditId) {
    return s.govAuditStatus === "in_progress"
      ? `/app/gov-audits/${s.govAuditId}`
      : `/app/gov-audits/${s.govAuditId}/done`;
  }
  // External-certificate tasks (Zooniverse) live at /app/external/[id] for
  // both active and post-decision states — the generic project hub doesn't
  // render the right UI for them.
  if (s.task.evidence_mode === "external_certificate") return `/app/external/${s.id}`;
  if (["committed", "in_progress", "needs_changes"].includes(s.status)) return `/app/projects/${s.id}`;
  return `/app/submissions/${s.id}`;
}

/** Status to display for a work item — the audit's validation status when present. */
export function workStatus(s: SubmissionWithTask): string {
  return s.auditStatus ?? s.govAuditStatus ?? s.status;
}

/** Effective-status values that mean the work is finished and no longer "active". */
const TERMINAL_WORK_STATUSES = new Set(["approved", "verified", "rejected"]);

export async function getUserById(id: string): Promise<User | null> {
  return (await getDb().prepare("SELECT * FROM users WHERE id = ?").bind(id).first<User>()) ?? null;
}

export async function getDisplayNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return new Map();
  const placeholders = unique.map(() => "?").join(",");
  const rows =
    (await getDb()
      .prepare(`SELECT id, full_name FROM users WHERE id IN (${placeholders})`)
      .bind(...unique)
      .all<{ id: string; full_name: string }>()).results ?? [];
  return new Map(rows.map((r) => [r.id, r.full_name ?? "A volunteer"]));
}

export async function getOrg(id: string): Promise<Org | null> {
  return (await getDb().prepare("SELECT * FROM orgs WHERE id = ?").bind(id).first<Org>()) ?? null;
}

export async function getOrgBySlug(slug: string): Promise<Org | null> {
  return (await getDb().prepare("SELECT * FROM orgs WHERE slug = ?").bind(slug).first<Org>()) ?? null;
}

export async function listOrgs(): Promise<Org[]> {
  return (await getDb().prepare("SELECT * FROM orgs ORDER BY name").all<Org>()).results ?? [];
}

export async function listActiveTasks(): Promise<(TaskTemplate & { org: Org })[]> {
  const tasks = (await getDb()
    .prepare("SELECT * FROM task_templates WHERE status = 'active' AND (closes_at IS NULL OR closes_at > unixepoch() * 1000) ORDER BY created_at DESC")
    .all<TaskTemplate>()).results ?? [];
  const orgs = await listOrgs();
  const byId = new Map(orgs.map((o) => [o.id, o]));
  return tasks.map((t) => ({ ...t, org: byId.get(t.org_id)! })).filter((t) => t.org);
}

export async function getTask(id: string): Promise<(TaskTemplate & { org: Org }) | null> {
  const t = await getDb().prepare("SELECT * FROM task_templates WHERE id = ?").bind(id).first<TaskTemplate>();
  if (!t) return null;
  const org = await getOrg(t.org_id);
  if (!org) return null;
  return { ...t, org };
}

/** The lifecycle subset of a task template needed to decide if it can be
 *  committed to. Kept narrow so the guard is cheap and easy to reason about. */
export interface TaskLifecycle {
  id: string;
  status: string;
  closes_at: number | null;
  listing_type: string;
}

/**
 * Pure server-side gate for whether a task can be committed to (H11). Rejects:
 *   - tasks not in the 'active' state (draft / paused / archived),
 *   - tasks whose `closes_at` deadline has passed,
 *   - directory-only listings (`listing_type !== 'native'`) — those link out to
 *     the org's own signup and must never spawn a colift submission.
 * `now` is injectable for tests. Pure: no DB access, so the same logic can be
 * exercised in unit tests and reused at the action's call site.
 */
export function isTaskCommittable(
  t: Pick<TaskLifecycle, "status" | "closes_at" | "listing_type">,
  now: number = Date.now()
): boolean {
  if (t.status !== "active") return false;
  if (t.closes_at != null && t.closes_at <= now) return false;
  if (t.listing_type !== "native") return false;
  return true;
}

/**
 * Fetch a task's lifecycle fields only if it exists AND passes the commit gate.
 * Returns null when the task is missing, closed, paused/archived/draft, or a
 * directory-only external listing. The commit action uses this as the single
 * authoritative server-side guard before inserting a submission.
 */
export async function getCommittableTask(
  id: string,
  now: number = Date.now()
): Promise<TaskLifecycle | null> {
  const t = await getDb()
    .prepare("SELECT id, status, closes_at, listing_type FROM task_templates WHERE id = ?")
    .bind(id)
    .first<TaskLifecycle>();
  if (!t) return null;
  return isTaskCommittable(t, now) ? t : null;
}

async function hydrate(subs: Submission[]): Promise<SubmissionWithTask[]> {
  if (subs.length === 0) return [];
  const tasks = (await getDb().prepare("SELECT * FROM task_templates").all<TaskTemplate>()).results ?? [];
  const orgs = await listOrgs();
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const orgById = new Map(orgs.map((o) => [o.id, o]));

  // Food-audit + gov-audit tasks each carry a parallel row keyed by
  // submission_id; attach it so callers can route to the correct flow and show
  // the audit's own status (the submissions.status alone is misleading — e.g. a
  // food-audit's submission stays "committed" while the audit progresses).
  const ids = subs.map((s) => s.id);
  const placeholders = ids.map(() => "?").join(",");
  const [auditRows, govAuditRows] = await Promise.all([
    getDb()
      .prepare(`SELECT id, submission_id, validation_status FROM audits WHERE submission_id IN (${placeholders})`)
      .bind(...ids)
      .all<{ id: string; submission_id: string; validation_status: string }>(),
    getDb()
      .prepare(`SELECT id, submission_id, status FROM gov_audit_sessions WHERE submission_id IN (${placeholders})`)
      .bind(...ids)
      .all<{ id: string; submission_id: string; status: string }>(),
  ]);
  const auditBySub = new Map((auditRows.results ?? []).map((a) => [a.submission_id, a]));
  const govAuditBySub = new Map((govAuditRows.results ?? []).map((a) => [a.submission_id, a]));

  return subs
    .map((s) => {
      const task = taskById.get(s.task_template_id);
      const org = task ? orgById.get(task.org_id) : undefined;
      if (!task || !org) return null;
      const audit = auditBySub.get(s.id);
      const gov = govAuditBySub.get(s.id);
      return {
        ...s,
        task,
        org,
        auditId: audit?.id ?? null,
        auditStatus: audit?.validation_status ?? null,
        govAuditId: gov?.id ?? null,
        govAuditStatus: gov?.status ?? null,
      };
    })
    .filter(Boolean) as SubmissionWithTask[];
}

export async function getSubmission(id: string): Promise<SubmissionWithTask | null> {
  const s = await getDb().prepare("SELECT * FROM submissions WHERE id = ?").bind(id).first<Submission>();
  if (!s) return null;
  return (await hydrate([s]))[0] ?? null;
}

export async function listSubmissionsForUser(userId: string): Promise<SubmissionWithTask[]> {
  const subs = (await getDb()
    .prepare("SELECT * FROM submissions WHERE user_id = ? ORDER BY committed_at DESC")
    .bind(userId)
    .all<Submission>()).results ?? [];
  return hydrate(subs);
}

export async function listSubmissionsForOrg(orgId: string, status?: string): Promise<SubmissionWithTask[]> {
  let sql =
    "SELECT s.* FROM submissions s JOIN task_templates t ON t.id = s.task_template_id WHERE t.org_id = ?";
  const binds: string[] = [orgId];
  if (status && status !== "all") {
    sql += " AND s.status = ?";
    binds.push(status);
  }
  sql += " ORDER BY s.submitted_at DESC, s.committed_at DESC";
  const subs = (await getDb().prepare(sql).bind(...binds).all<Submission>()).results ?? [];
  return hydrate(subs);
}

export async function getSubmissionFiles(submissionId: string): Promise<SubmissionFile[]> {
  return (
    (await getDb()
      .prepare("SELECT * FROM submission_files WHERE submission_id = ?")
      .bind(submissionId)
      .all<SubmissionFile>()).results ?? []
  );
}

export async function getSubmissionFlags(submissionId: string): Promise<SubmissionFlagRow[]> {
  return (
    (await getDb()
      .prepare("SELECT * FROM submission_flags WHERE submission_id = ? ORDER BY created_at")
      .bind(submissionId)
      .all<SubmissionFlagRow>()).results ?? []
  );
}

export async function getLedgerForUser(userId: string, month: string): Promise<HoursLedgerRow[]> {
  return (
    (await getDb()
      .prepare("SELECT * FROM hours_ledger WHERE user_id = ? AND month = ?")
      .bind(userId, month)
      .all<HoursLedgerRow>()).results ?? []
  );
}

export interface DashboardData {
  certified: number;
  pending: number;
  active: SubmissionWithTask[];
  completed: SubmissionWithTask[];
  recent: SubmissionWithTask[];
  month: string;
}

export interface OrgDashboardData {
  pendingCount: number;
  activeTasks: number;
  hoursSponsored: number;
  recipientsServed: number;
  recent: SubmissionWithTask[];
  month: string;
}

export async function getOrgDashboard(orgId: string, now: number = Date.now()): Promise<OrgDashboardData> {
  const month = currentMonth(now);
  const db = getDb();
  const subs = await listSubmissionsForOrg(orgId);
  const pendingCount = subs.filter((s) => s.status === "pending_review" || s.status === "ai_reviewing").length;
  const activeRow = await db
    .prepare("SELECT COUNT(*) AS n FROM task_templates WHERE org_id = ? AND status = 'active'")
    .bind(orgId)
    .first<{ n: number }>();
  const ledgerRow = await db
    .prepare("SELECT COALESCE(SUM(total_hours),0) AS h FROM hours_ledger WHERE certified_org_id = ? AND month = ?")
    .bind(orgId, month)
    .first<{ h: number }>();
  const served = new Set(subs.filter((s) => s.status === "approved").map((s) => s.user_id));
  return {
    pendingCount,
    activeTasks: activeRow?.n ?? 0,
    hoursSponsored: ledgerRow?.h ?? 0,
    recipientsServed: served.size,
    recent: subs.slice(0, 6),
    month,
  };
}

const PENDING_STATUSES = new Set(["submitted", "ai_reviewing", "pending_review"]);
const ACTIVE_STATUSES = new Set(["committed", "in_progress", "submitted", "ai_reviewing", "pending_review", "needs_changes"]);

export async function getRecipientDashboard(userId: string, now: number = Date.now()): Promise<DashboardData> {
  const month = currentMonth(now);
  const [ledger, subs] = await Promise.all([
    getLedgerForUser(userId, month),
    listSubmissionsForUser(userId),
  ]);
  const certified = ledger.reduce((a, r) => a + r.total_hours, 0);
  let pending = 0;
  for (const s of subs) {
    if (PENDING_STATUSES.has(s.status)) {
      const measured = ((s as unknown as { measured_active_seconds: number }).measured_active_seconds ?? 0) / 3600;
      pending += Math.min(s.hours_credited ?? measured, s.task.max_hours);
    }
  }
  // Once work is submitted it leaves "active" and shows under "completed" — even
  // while in review or after approval/rejection. `needs_changes` bounces it back
  // to the recipient, so it counts as active again despite having a submit time.
  const isSubmitted = (s: SubmissionWithTask) =>
    s.submitted_at != null && s.status !== "needs_changes";
  // A food-audit's or gov-audit's submission row stays "committed" while its
  // audit progresses, so fall back to the parallel audit's own status to decide
  // whether it's still active.
  const isFinalGovStatus = (st: string | null | undefined) =>
    st === "finalized" || st === "flagged" || st === "submitted";
  const active = subs.filter((s) => {
    if (isSubmitted(s)) return false;
    const eff = s.auditStatus ?? s.govAuditStatus ?? s.status;
    if (TERMINAL_WORK_STATUSES.has(eff)) return false;
    if (s.govAuditId) return s.govAuditStatus === "in_progress";
    return s.auditId ? true : ACTIVE_STATUSES.has(s.status);
  });
  const completed = subs
    .filter((s) => {
      if (isSubmitted(s)) return true;
      // gov-audit's submission row may stay "committed" with a non-null
      // submitted_at on its session; treat any non-in_progress gov session as
      // completed for dashboard purposes.
      if (s.govAuditId && isFinalGovStatus(s.govAuditStatus)) return true;
      return false;
    })
    .sort((a, b) => (b.submitted_at ?? 0) - (a.submitted_at ?? 0));
  return { certified, pending, active, completed, recent: subs.slice(0, 5), month };
}
