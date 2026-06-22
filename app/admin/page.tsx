import { Users, Building2, ListChecks, Inbox, Clock, MessageSquare, CheckCircle2, AlertTriangle } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { StatusPill } from "@/components/status-pill";
import { EmptyState } from "@/components/empty-state";
import { formatHours, relativeTime } from "@/lib/time";
import type { SubmissionStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin overview — Tended" };

interface RecentRow {
  id: string;
  status: SubmissionStatus;
  committed_at: number;
  submitted_at: number | null;
  title: string;
  full_name: string | null;
}

async function count(sql: string, ...binds: unknown[]): Promise<number> {
  const row = await getDb().prepare(sql).bind(...binds).first<{ n: number }>();
  return row?.n ?? 0;
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 [&_svg]:size-5">
      <div className="flex items-center gap-2 text-meta">{icon}<span className="overline">{label}</span></div>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}

export default async function AdminOverviewPage() {
  await requireAdmin();
  const db = getDb();

  const [
    users,
    orgs,
    tasks,
    subsTotal,
    pending,
    approved,
    needsChanges,
    feedback,
  ] = await Promise.all([
    count("SELECT COUNT(*) AS n FROM users"),
    count("SELECT COUNT(*) AS n FROM orgs"),
    count("SELECT COUNT(*) AS n FROM task_templates"),
    count("SELECT COUNT(*) AS n FROM submissions"),
    count("SELECT COUNT(*) AS n FROM submissions WHERE status = 'pending_review'"),
    count("SELECT COUNT(*) AS n FROM submissions WHERE status = 'approved'"),
    count("SELECT COUNT(*) AS n FROM submissions WHERE status IN ('needs_changes','rejected')"),
    count("SELECT COUNT(*) AS n FROM feedback"),
  ]);

  const hoursRow = await db
    .prepare("SELECT COALESCE(SUM(total_hours),0) AS h FROM hours_ledger")
    .first<{ h: number }>();
  const certifiedHours = hoursRow?.h ?? 0;

  const recent = (await db
    .prepare(
      `SELECT s.id, s.status, s.committed_at, s.submitted_at, t.title AS title, u.full_name AS full_name
       FROM submissions s
       JOIN task_templates t ON t.id = s.task_template_id
       JOIN users u ON u.id = s.user_id
       ORDER BY COALESCE(s.submitted_at, s.committed_at) DESC
       LIMIT 8`
    )
    .all<RecentRow>()).results ?? [];

  return (
    <div className="space-y-8">
      <div>
        <p className="overline mb-1">Tended admin</p>
        <h1 className="text-[28px] font-semibold text-ink">Overview</h1>
        <p className="mt-1 text-body">A read-only snapshot of the dataset.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={<Users />} value={users} label="Users" />
        <Stat icon={<Building2 />} value={orgs} label="Organizations" />
        <Stat icon={<ListChecks />} value={tasks} label="Task templates" />
        <Stat icon={<Inbox />} value={subsTotal} label="Submissions" />
        <Stat icon={<Clock />} value={`${formatHours(certifiedHours)}h`} label="Certified hours" />
        <Stat icon={<MessageSquare />} value={feedback} label="Feedback" />
      </div>

      <div>
        <h2 className="mb-3 text-[22px] font-semibold text-ink">Submissions by status</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat icon={<AlertTriangle />} value={pending} label="Pending review" />
          <Stat icon={<CheckCircle2 />} value={approved} label="Approved" />
          <Stat icon={<AlertTriangle />} value={needsChanges} label="Needs changes / rejected" />
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-[22px] font-semibold text-ink">Recent submissions</h2>
        {recent.length === 0 ? (
          <EmptyState icon={<Inbox />} title="No submissions yet." />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
            {recent.map((s) => (
              <li key={s.id} className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{s.title}</p>
                  <p className="truncate text-sm text-body">
                    {s.full_name ?? "A volunteer"} · {relativeTime(s.submitted_at ?? s.committed_at)}
                  </p>
                </div>
                <StatusPill status={s.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
