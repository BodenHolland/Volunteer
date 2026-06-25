import { Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { StatusPill } from "@/components/status-pill";
import { EmptyState } from "@/components/empty-state";
import { relativeTime, formatHours } from "@/lib/time";
import type { SubmissionStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Submissions — colift admin" };

interface SubRow {
  id: string;
  status: SubmissionStatus;
  hours_credited: number | null;
  committed_at: number;
  submitted_at: number | null;
  title: string;
  full_name: string | null;
}

export default async function AdminSubmissionsPage() {
  await requireAdmin();
  const rows = (await getDb()
    .prepare(
      `SELECT s.id, s.status, s.hours_credited, s.committed_at, s.submitted_at,
        t.title AS title, u.full_name AS full_name
       FROM submissions s
       JOIN task_templates t ON t.id = s.task_template_id
       JOIN users u ON u.id = s.user_id
       ORDER BY COALESCE(s.submitted_at, s.committed_at) DESC`
    )
    .all<SubRow>()).results ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold text-ink">Submissions</h1>
        <p className="mt-1 text-body">{rows.length} submissions across all organizations.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Inbox />} title="No submissions yet." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white">
          <div className="hidden items-center gap-4 border-b border-line bg-section px-4 py-2.5 text-xs font-medium text-meta md:flex">
            <span className="flex-1">Task</span>
            <span className="w-44">Recipient</span>
            <span className="w-44">Status</span>
            <span className="w-20">Hours</span>
            <span className="w-32">Activity</span>
          </div>
          <ul className="divide-y divide-line">
            {rows.map((s) => (
              <li key={s.id} className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:gap-4">
                <span className="flex-1 truncate font-medium text-ink">{s.title}</span>
                <span className="w-44 truncate text-sm text-body">{s.full_name ?? "A volunteer"}</span>
                <span className="w-44"><StatusPill status={s.status} /></span>
                <span className="w-20 text-sm text-body">{s.hours_credited != null ? `${formatHours(s.hours_credited)}h` : "—"}</span>
                <span className="w-32 text-sm text-meta">{relativeTime(s.submitted_at ?? s.committed_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
