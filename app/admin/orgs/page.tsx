import { Building2 } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { EmptyState } from "@/components/empty-state";
import { relativeTime } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Organizations — Tended admin" };

interface OrgRow {
  id: string;
  name: string;
  status: string;
  is_fictional: number;
  created_at: number;
  active_tasks: number;
}

export default async function AdminOrgsPage() {
  await requireAdmin();
  const rows = (await getDb()
    .prepare(
      `SELECT o.id, o.name, o.status, o.is_fictional, o.created_at,
        (SELECT COUNT(*) FROM task_templates t WHERE t.org_id = o.id AND t.status = 'active') AS active_tasks
       FROM orgs o
       ORDER BY o.name`
    )
    .all<OrgRow>()).results ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold text-ink">Organizations</h1>
        <p className="mt-1 text-body">{rows.length} organizations in the demo dataset.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Building2 />} title="No organizations found." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white">
          <div className="hidden items-center gap-4 border-b border-line bg-section px-4 py-2.5 text-xs font-medium text-meta md:flex">
            <span className="flex-1">Name</span>
            <span className="w-28">Status</span>
            <span className="w-24">Type</span>
            <span className="w-28">Active tasks</span>
            <span className="w-32">Created</span>
          </div>
          <ul className="divide-y divide-line">
            {rows.map((o) => (
              <li key={o.id} className="flex flex-col gap-1 px-4 py-3 md:flex-row md:items-center md:gap-4">
                <span className="flex-1 font-medium text-ink">{o.name}</span>
                <span className="w-28 text-sm text-body">{o.status}</span>
                <span className="w-24 text-sm text-body">{o.is_fictional ? "Fictional" : "Real"}</span>
                <span className="w-28 text-sm text-body">{o.active_tasks}</span>
                <span className="w-32 text-sm text-meta">{relativeTime(o.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
