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
}

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
    .prepare("SELECT * FROM task_templates WHERE status = 'active' ORDER BY created_at DESC")
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

async function hydrate(subs: Submission[]): Promise<SubmissionWithTask[]> {
  if (subs.length === 0) return [];
  const tasks = (await getDb().prepare("SELECT * FROM task_templates").all<TaskTemplate>()).results ?? [];
  const orgs = await listOrgs();
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const orgById = new Map(orgs.map((o) => [o.id, o]));
  return subs
    .map((s) => {
      const task = taskById.get(s.task_template_id);
      const org = task ? orgById.get(task.org_id) : undefined;
      return task && org ? { ...s, task, org } : null;
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
  const active = subs.filter((s) => ACTIVE_STATUSES.has(s.status));
  return { certified, pending, active, recent: subs.slice(0, 5), month };
}
