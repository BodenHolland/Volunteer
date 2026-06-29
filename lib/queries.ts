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

/**
 * SQLite (and therefore D1) caps a statement's bound parameters at 999. An
 * unbounded `IN (?, ?, …)` built from a user-sized id list will eventually
 * blow that limit (H7), so split the list into fixed-size chunks and run one
 * statement per chunk. 90 is well under the limit and leaves room for the
 * other binds in the surrounding query.
 */
export const IN_CHUNK_SIZE = 90;

export function chunkArray<T>(items: T[], size: number = IN_CHUNK_SIZE): T[][] {
  if (size <= 0) return items.length ? [items] : [];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

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
  const db = getDb();
  const out = new Map<string, string>();
  // Chunk the IN-list so a large id set can't exceed SQLite's bound-param cap (H7).
  for (const chunk of chunkArray(unique)) {
    const placeholders = chunk.map(() => "?").join(",");
    const rows =
      (await db
        .prepare(`SELECT id, full_name FROM users WHERE id IN (${placeholders})`)
        .bind(...chunk)
        .all<{ id: string; full_name: string }>()).results ?? [];
    for (const r of rows) out.set(r.id, r.full_name ?? "A volunteer");
  }
  return out;
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
  const db = getDb();

  // M12: hydrate only the task templates these submissions actually reference,
  // not the entire task_templates table (which grows without bound). The
  // distinct template-id set is at most subs.length, so the lookup stays small.
  // Orgs are few and bounded, so loading all of them is fine.
  const templateIds = [...new Set(subs.map((s) => s.task_template_id))].filter(Boolean);
  const taskById = new Map<string, TaskTemplate>();
  for (const chunk of chunkArray(templateIds)) {
    const placeholders = chunk.map(() => "?").join(",");
    const rows =
      (await db
        .prepare(`SELECT * FROM task_templates WHERE id IN (${placeholders})`)
        .bind(...chunk)
        .all<TaskTemplate>()).results ?? [];
    for (const t of rows) taskById.set(t.id, t);
  }
  const orgs = await listOrgs();
  const orgById = new Map(orgs.map((o) => [o.id, o]));

  // Food-audit + gov-audit tasks each carry a parallel row keyed by
  // submission_id; attach it so callers can route to the correct flow and show
  // the audit's own status (the submissions.status alone is misleading — e.g. a
  // food-audit's submission stays "committed" while the audit progresses).
  // Chunk the IN-lists so a large submission set can't exceed the bound-param
  // cap (H7).
  const ids = subs.map((s) => s.id);
  const auditBySub = new Map<string, { id: string; submission_id: string; validation_status: string }>();
  const govAuditBySub = new Map<string, { id: string; submission_id: string; status: string }>();
  for (const chunk of chunkArray(ids)) {
    const placeholders = chunk.map(() => "?").join(",");
    const [auditRows, govAuditRows] = await Promise.all([
      db
        .prepare(`SELECT id, submission_id, validation_status FROM audits WHERE submission_id IN (${placeholders})`)
        .bind(...chunk)
        .all<{ id: string; submission_id: string; validation_status: string }>(),
      db
        .prepare(`SELECT id, submission_id, status FROM gov_audit_sessions WHERE submission_id IN (${placeholders})`)
        .bind(...chunk)
        .all<{ id: string; submission_id: string; status: string }>(),
    ]);
    for (const a of auditRows.results ?? []) auditBySub.set(a.submission_id, a);
    for (const a of govAuditRows.results ?? []) govAuditBySub.set(a.submission_id, a);
  }

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

/**
 * Default page size for the paginated list queries (M-perf). Bounds the org
 * review queue and recipient "My work" reads so they can't hydrate the entire
 * submissions table once row counts reach the low thousands.
 */
export const SUBMISSIONS_PAGE_SIZE = 25;

/**
 * One page of hydrated submissions plus an opaque keyset cursor for fetching
 * the next page. `nextCursor` is null when the page reached the end.
 */
export interface SubmissionsPage {
  items: SubmissionWithTask[];
  nextCursor: string | null;
}

/**
 * Keyset cursors are an opaque, URL-safe (base64url) encoding of the sort tuple
 * of the last row on the current page — its timestamp keys plus the row id as a
 * stable unique tiebreaker. Encoding it opaquely avoids leaking row internals
 * into the URL. A null timestamp (an unsubmitted row's `submitted_at`) is
 * encoded as an empty field; submission ids are opaque strings, never numbers.
 */
type CursorParts = { ts: (number | null)[]; id: string };

function encodeCursor(ts: (number | null)[], id: string): string {
  const payload = [...ts.map((p) => (p == null ? "" : String(p))), id].join("|");
  return Buffer.from(payload, "utf8").toString("base64url");
}

function decodeCursor(cursor: string): CursorParts | null {
  try {
    const parts = Buffer.from(cursor, "base64url").toString("utf8").split("|");
    if (parts.length < 2) return null;
    const id = parts[parts.length - 1];
    const ts = parts.slice(0, -1).map((s) => (s === "" ? null : Number(s)));
    if (ts.some((n) => n != null && Number.isNaN(n))) return null;
    return { ts, id };
  } catch {
    return null;
  }
}

/**
 * Recipient "My work" — one keyset page ordered by `committed_at DESC, id DESC`
 * (id is a stable unique tiebreaker so the cursor never skips/repeats rows when
 * two submissions share a timestamp). Pass the previous page's `nextCursor` to
 * page forward.
 */
export async function listSubmissionsForUser(
  userId: string,
  opts: { cursor?: string | null; limit?: number } = {}
): Promise<SubmissionsPage> {
  const limit = opts.limit ?? SUBMISSIONS_PAGE_SIZE;
  let sql = "SELECT * FROM submissions WHERE user_id = ?";
  const binds: (string | number)[] = [userId];
  if (opts.cursor) {
    const c = decodeCursor(opts.cursor);
    if (c && c.ts[0] != null) {
      // (committed_at, id) strictly after the cursor under DESC ordering.
      sql += " AND (committed_at < ? OR (committed_at = ? AND id < ?))";
      binds.push(c.ts[0], c.ts[0], c.id);
    }
  }
  sql += " ORDER BY committed_at DESC, id DESC LIMIT ?";
  binds.push(limit + 1);
  const rows = (await getDb().prepare(sql).bind(...binds).all<Submission>()).results ?? [];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  const nextCursor = hasMore && last ? encodeCursor([last.committed_at], last.id) : null;
  return { items: await hydrate(page), nextCursor };
}

/**
 * Org review queue — one keyset page ordered by
 * `submitted_at DESC, committed_at DESC, id DESC` (matching the prior sort, with
 * id as a stable unique tiebreaker). `submitted_at` may be null; SQLite sorts
 * NULLs last under DESC, which we preserve in the keyset comparison via a
 * sentinel encoding so committed-but-unsubmitted rows page consistently.
 */
export async function listSubmissionsForOrg(
  orgId: string,
  status?: string,
  opts: { cursor?: string | null; limit?: number } = {}
): Promise<SubmissionsPage> {
  const limit = opts.limit ?? SUBMISSIONS_PAGE_SIZE;
  let sql =
    "SELECT s.* FROM submissions s JOIN task_templates t ON t.id = s.task_template_id WHERE t.org_id = ?";
  const binds: (string | number | null)[] = [orgId];
  if (status && status !== "all") {
    sql += " AND s.status = ?";
    binds.push(status);
  }
  if (opts.cursor) {
    const c = decodeCursor(opts.cursor);
    if (c && c.ts[1] != null) {
      // submitted_at NULLs sort last under DESC. Use COALESCE(...,-1) on both
      // sides so a row "after" a NULL-cursor (also NULL) falls through to the
      // committed_at/id tiebreakers, and non-NULL rows are never after a NULL.
      const sub = c.ts[0];
      const com = c.ts[1];
      sql +=
        " AND (COALESCE(s.submitted_at,-1) < COALESCE(?,-1)" +
        " OR (COALESCE(s.submitted_at,-1) = COALESCE(?,-1) AND s.committed_at < ?)" +
        " OR (COALESCE(s.submitted_at,-1) = COALESCE(?,-1) AND s.committed_at = ? AND s.id < ?))";
      binds.push(sub, sub, com, sub, com, c.id);
    }
  }
  sql += " ORDER BY s.submitted_at DESC, s.committed_at DESC, s.id DESC LIMIT ?";
  binds.push(limit + 1);
  const rows = (await getDb().prepare(sql).bind(...binds).all<Submission>()).results ?? [];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last ? encodeCursor([last.submitted_at, last.committed_at], last.id) : null;
  return { items: await hydrate(page), nextCursor };
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
  // Set-based counts: compute each stat with a SQL aggregate over this org's
  // submissions instead of loading every row and filtering in JS (M-perf). The
  // numbers are identical to the prior JS reductions.
  const [pendingRow, servedRow, activeRow, ledgerRow, recentPage] = await Promise.all([
    // pendingCount: previously subs.filter(status in {pending_review, ai_reviewing}).
    db
      .prepare(
        "SELECT COUNT(*) AS n FROM submissions s JOIN task_templates t ON t.id = s.task_template_id" +
          " WHERE t.org_id = ? AND s.status IN ('pending_review','ai_reviewing')"
      )
      .bind(orgId)
      .first<{ n: number }>(),
    // recipientsServed: previously new Set(approved subs' user_id).size.
    db
      .prepare(
        "SELECT COUNT(DISTINCT s.user_id) AS n FROM submissions s JOIN task_templates t ON t.id = s.task_template_id" +
          " WHERE t.org_id = ? AND s.status = 'approved'"
      )
      .bind(orgId)
      .first<{ n: number }>(),
    db
      .prepare("SELECT COUNT(*) AS n FROM task_templates WHERE org_id = ? AND status = 'active'")
      .bind(orgId)
      .first<{ n: number }>(),
    db
      .prepare("SELECT COALESCE(SUM(total_hours),0) AS h FROM hours_ledger WHERE certified_org_id = ? AND month = ?")
      .bind(orgId, month)
      .first<{ h: number }>(),
    // recent: same ordering as the (now paginated) list query, capped at 6.
    listSubmissionsForOrg(orgId, undefined, { limit: 6 }),
  ]);
  return {
    pendingCount: pendingRow?.n ?? 0,
    activeTasks: activeRow?.n ?? 0,
    hoursSponsored: ledgerRow?.h ?? 0,
    recipientsServed: servedRow?.n ?? 0,
    recent: recentPage.items,
    month,
  };
}

const ACTIVE_STATUSES = new Set(["committed", "in_progress", "submitted", "ai_reviewing", "pending_review", "needs_changes"]);

/**
 * Upper bound on the recipient dashboard's active/completed list fetch (M-perf).
 * These lists are a single user's own in-flight + finished work — naturally
 * bounded in practice — but the dashboard previously loaded the user's entire
 * history with no LIMIT to classify it in JS. A generous cap bounds the worst
 * case without truncating any realistic user's lists; the full history remains
 * available, paginated, on the "My work" page.
 */
const RECIPIENT_DASHBOARD_LIST_LIMIT = 100;

export async function getRecipientDashboard(userId: string, now: number = Date.now()): Promise<DashboardData> {
  const month = currentMonth(now);
  const db = getDb();
  // certified + pending are scalar reductions — compute them with SQL aggregates
  // rather than summing hydrated rows in JS (M-perf). The pending sum mirrors the
  // prior JS exactly: for each in-review submission, min(credited ?? measured
  // hours, task.max_hours), where measured = measured_active_seconds / 3600.
  const [certifiedRow, pendingRow, subs] = await Promise.all([
    db
      .prepare("SELECT COALESCE(SUM(total_hours),0) AS h FROM hours_ledger WHERE user_id = ? AND month = ?")
      .bind(userId, month)
      .first<{ h: number }>(),
    db
      .prepare(
        "SELECT COALESCE(SUM(MIN(" +
          "COALESCE(s.hours_credited, s.measured_active_seconds / 3600.0), t.max_hours" +
          ")),0) AS h FROM submissions s JOIN task_templates t ON t.id = s.task_template_id" +
          " WHERE s.user_id = ? AND s.status IN ('submitted','ai_reviewing','pending_review')"
      )
      .bind(userId)
      .first<{ h: number }>(),
    // active + completed are rendered lists that depend on hydrated audit /
    // gov-audit statuses, so they still need real rows; the list query is now
    // bounded by a LIMIT page instead of loading the whole history.
    listSubmissionsForUser(userId, { limit: RECIPIENT_DASHBOARD_LIST_LIMIT }),
  ]).then(([c, p, page]) => [c, p, page.items] as const);
  const certified = certifiedRow?.h ?? 0;
  const pending = pendingRow?.h ?? 0;
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
