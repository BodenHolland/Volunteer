import Link from "next/link";
import { ListChecks, Plus, MapPin, Clock, Users, Pencil } from "lucide-react";
import { requireOrgMember } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatHours } from "@/lib/time";
import { getDict } from "@/lib/i18n";
import type { TaskTemplate } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tasks | colift" };

const STATUS_STYLES: Record<TaskTemplate["status"], string> = {
  draft: "bg-section text-meta",
  active: "bg-forest-subtle text-forest",
  paused: "bg-amber-subtle text-amber",
  archived: "bg-brick-subtle text-brick",
};

export default async function OrgTasksPage() {
  const { t } = await getDict();
  const user = await requireOrgMember();
  const isAdmin = user.org_role === "org_admin";
  if (!user.org_id) {
    return <EmptyState icon={<ListChecks />} title={t.orgTasks.noOrgLinked} />;
  }

  const CATEGORY_LABELS: Record<string, string> = {
    "data-collection": t.orgTasks.catDataCollection,
    translation: t.orgTasks.catTranslation,
    "civic-input": t.orgTasks.catCivicInput,
    "neighborhood-writing": t.orgTasks.catNeighborhoodWriting,
    seminar: t.orgTasks.catSeminar,
  };

  const LOCATION_LABELS: Record<string, string> = {
    online: t.orgTasks.locOnline,
    in_person: t.orgTasks.locInPerson,
    hybrid: t.orgTasks.locHybrid,
  };

  const db = getDb();
  const tasks: TaskTemplate[] =
    (await db
      .prepare("SELECT * FROM task_templates WHERE org_id = ? ORDER BY created_at DESC")
      .bind(user.org_id)
      .all<TaskTemplate>()).results ?? [];

  // Submission counts per task.
  const counts = new Map<string, number>();
  await Promise.all(
    tasks.map(async (task) => {
      const row = await db
        .prepare("SELECT COUNT(*) AS n FROM submissions WHERE task_template_id = ?")
        .bind(task.id)
        .first<{ n: number }>();
      counts.set(task.id, row?.n ?? 0);
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold text-ink">{t.orgTasks.title}</h1>
          <p className="mt-1 text-body">
            {isAdmin ? t.orgTasks.adminDesc : t.orgTasks.nonAdminDesc}
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/org/tasks/new"><Plus /> {t.orgTasks.createTask}</Link>
          </Button>
        )}
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<ListChecks />}
          title={t.orgTasks.emptyState}
          ctaLabel={isAdmin ? t.orgTasks.createTask : undefined}
          ctaHref={isAdmin ? "/org/tasks/new" : undefined}
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
          {tasks.map((task) => {
            const count = counts.get(task.id) ?? 0;
            const gatePassed =
              !!task.gate_external_beneficiary &&
              !!task.gate_genuine_need &&
              !!task.gate_free_deliverable &&
              !!task.gate_would_do_anyway;
            const inner = (
              <div className="flex items-start gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-ink">{task.title}</p>
                    <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium capitalize", STATUS_STYLES[task.status])}>
                      {task.status}
                    </span>
                    <span
                      className={cn(
                        "inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium",
                        gatePassed ? "bg-forest-subtle text-forest" : "bg-amber-subtle text-amber"
                      )}
                    >
                      {gatePassed ? t.orgTasks.gatePassed : t.orgTasks.gateIncomplete}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-meta">
                    <span>{CATEGORY_LABELS[task.category] ?? task.category}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {LOCATION_LABELS[task.location_kind] ?? task.location_kind}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {formatHours(task.est_hours)}{formatHours(task.max_hours)}h</span>
                    <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {count} {count === 1 ? t.orgTasks.submission : t.orgTasks.submissions}</span>
                  </div>
                </div>
                {isAdmin && <Pencil className="size-4 shrink-0 text-meta" aria-hidden />}
              </div>
            );
            return (
              <li key={task.id}>
                {isAdmin ? (
                  <Link href={`/org/tasks/${task.id}/edit`} className="block hover:bg-section">{inner}</Link>
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
