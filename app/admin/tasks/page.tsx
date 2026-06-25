import { ListChecks, Check, X } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/time";
import { approveTaskGate } from "./actions";
import type { TaskTemplate } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Task approval — colift admin" };

interface TaskRow extends TaskTemplate {
  org_name: string | null;
}

const GATES: { key: keyof TaskTemplate; label: string }[] = [
  { key: "gate_external_beneficiary", label: "External beneficiary" },
  { key: "gate_genuine_need", label: "Genuine need" },
  { key: "gate_free_deliverable", label: "Free public deliverable" },
  { key: "gate_would_do_anyway", label: "Would-do-anyway" },
];

export default async function AdminTasksPage() {
  await requireAdmin();
  const rows = (await getDb()
    .prepare(
      `SELECT t.*, o.name AS org_name
         FROM task_templates t
         LEFT JOIN orgs o ON o.id = t.org_id
        ORDER BY t.created_at DESC`
    )
    .all<TaskRow>()).results ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold text-ink">Task approval</h1>
          <p className="mt-1 text-body">
            Every task template must pass the 4-part beneficiary gate before it can go active.
            Approve templates that meet all four criteria; those missing criteria stay draft.
          </p>
        </div>
        <a
          href="/admin/tasks/zooniverse"
          className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-sm font-medium text-ink hover:bg-section"
        >
          Zooniverse catalog →
        </a>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<ListChecks />} title="No task templates yet." />
      ) : (
        <ul className="space-y-4">
          {rows.map((t) => {
            const gatePassed = GATES.every((g) => !!t[g.key]);
            const reviewed = !!t.gate_reviewed_at;
            return (
              <li key={t.id} className="rounded-lg border border-line bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{t.title}</p>
                    <p className="mt-0.5 text-sm text-meta">
                      {t.org_name ?? "Unknown org"} · {relativeTime(t.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium capitalize",
                        t.status === "active"
                          ? "bg-forest-subtle text-forest"
                          : "bg-section text-meta"
                      )}
                    >
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
                </div>

                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {GATES.map((g) => {
                    const ok = !!t[g.key];
                    return (
                      <li key={g.key} className="flex items-center gap-2 text-sm">
                        {ok ? (
                          <Check className="size-4 shrink-0 text-forest" aria-hidden />
                        ) : (
                          <X className="size-4 shrink-0 text-brick" aria-hidden />
                        )}
                        <span className={ok ? "text-body" : "text-meta"}>{g.label}</span>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {gatePassed ? (
                    reviewed ? (
                      <p className="text-sm text-forest">
                        Gate approved {relativeTime(t.gate_reviewed_at!)}.
                      </p>
                    ) : (
                      <form action={approveTaskGate}>
                        <input type="hidden" name="task_id" value={t.id} />
                        <Button type="submit" size="sm">
                          <Check /> Approve gate
                        </Button>
                      </form>
                    )
                  ) : (
                    <p className="text-sm text-meta">
                      Missing:{" "}
                      {GATES.filter((g) => !t[g.key])
                        .map((g) => g.label)
                        .join(", ")}
                      . Stays draft until the org completes the gate.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
