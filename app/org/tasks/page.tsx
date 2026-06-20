import Link from "next/link";
import { ListChecks, Plus, MapPin, Clock, Users, Pencil } from "lucide-react";
import { requireOrgMember } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatHours } from "@/lib/time";
import type { TaskTemplate } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tasks — Tended" };

const STATUS_STYLES: Record<TaskTemplate["status"], string> = {
  draft: "bg-section text-meta",
  active: "bg-forest-subtle text-forest",
  paused: "bg-amber-subtle text-amber",
  archived: "bg-brick-subtle text-brick",
};

const CATEGORY_LABELS: Record<string, string> = {
  "data-collection": "Data collection",
  translation: "Translation",
  "civic-input": "Civic input",
  "neighborhood-writing": "Neighborhood writing",
  seminar: "Seminar",
};

const LOCATION_LABELS: Record<string, string> = {
  online: "Online",
  in_person: "In person",
  hybrid: "Hybrid",
};

export default async function OrgTasksPage() {
  const user = await requireOrgMember();
  const isAdmin = user.org_role === "org_admin";
  if (!user.org_id) {
    return <EmptyState icon={<ListChecks />} title="No organization linked to this account." />;
  }

  const db = getDb();
  const tasks: TaskTemplate[] =
    (await db
      .prepare("SELECT * FROM task_templates WHERE org_id = ? ORDER BY created_at DESC")
      .bind(user.org_id)
      .all<TaskTemplate>()).results ?? [];

  // Submission counts per task.
  const counts = new Map<string, number>();
  await Promise.all(
    tasks.map(async (t) => {
      const row = await db
        .prepare("SELECT COUNT(*) AS n FROM submissions WHERE task_template_id = ?")
        .bind(t.id)
        .first<{ n: number }>();
      counts.set(t.id, row?.n ?? 0);
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold text-ink">Tasks</h1>
          <p className="mt-1 text-body">
            {isAdmin
              ? "The civic tasks your organization hosts for volunteers."
              : "The civic tasks your organization hosts. Editing is limited to admins."}
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/org/tasks/new"><Plus /> Create a task</Link>
          </Button>
        )}
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<ListChecks />}
          title="You haven't published any tasks yet. Create one to start hosting volunteers."
          ctaLabel={isAdmin ? "Create a task" : undefined}
          ctaHref={isAdmin ? "/org/tasks/new" : undefined}
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
          {tasks.map((t) => {
            const count = counts.get(t.id) ?? 0;
            const gatePassed =
              !!t.gate_external_beneficiary &&
              !!t.gate_genuine_need &&
              !!t.gate_free_deliverable &&
              !!t.gate_would_do_anyway;
            const inner = (
              <div className="flex items-start gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-ink">{t.title}</p>
                    <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium capitalize", STATUS_STYLES[t.status])}>
                      {t.status}
                    </span>
                    <span
                      className={cn(
                        "inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium",
                        gatePassed ? "bg-forest-subtle text-forest" : "bg-amber-subtle text-amber"
                      )}
                    >
                      {gatePassed ? "Gate: passed" : "Gate: incomplete"}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-meta">
                    <span>{CATEGORY_LABELS[t.category] ?? t.category}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {LOCATION_LABELS[t.location_kind] ?? t.location_kind}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {formatHours(t.est_hours)}–{formatHours(t.max_hours)}h</span>
                    <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {count} {count === 1 ? "submission" : "submissions"}</span>
                  </div>
                </div>
                {isAdmin && <Pencil className="size-4 shrink-0 text-meta" aria-hidden />}
              </div>
            );
            return (
              <li key={t.id}>
                {isAdmin ? (
                  <Link href={`/org/tasks/${t.id}/edit`} className="block hover:bg-section">{inner}</Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
