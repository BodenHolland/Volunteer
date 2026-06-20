import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ListChecks, Clock, StickyNote, ArrowRight } from "lucide-react";
import { requireRecipient } from "@/lib/session";
import { getSubmission } from "@/lib/queries";
import { Markdown } from "@/components/markdown";
import { OrgThumb } from "@/components/org-thumb";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { TimeLog } from "@/components/project/time-log";
import { Checklist } from "@/components/project/checklist";
import { Notes } from "@/components/project/notes";
import { parseJson, type ChecklistItem, type ChecklistProgress, type TimeLogSession } from "@/lib/types";
import { formatHours } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function ProjectHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRecipient();
  const sub = await getSubmission(id);
  if (!sub) notFound();
  if (sub.user_id !== user.id) redirect("/unauthorized");

  const checklist = parseJson<ChecklistItem[]>(sub.task.checklist_json, []);
  const progress = parseJson<ChecklistProgress>(sub.checklist_progress_json, {});
  const sessions = parseJson<TimeLogSession[]>(sub.time_log_json, []);

  const editable = ["committed", "in_progress", "needs_changes"].includes(sub.status);
  const allRequiredDone = checklist.filter((c) => c.required).every((c) => progress[c.id]);
  const hasSession = sessions.length > 0;
  const canSubmit = editable && allRequiredDone && hasSession;
  const submittedView = ["submitted", "ai_reviewing", "pending_review", "approved", "rejected"].includes(sub.status);

  return (
    <div>
      <Link href="/app/projects" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">
        <ArrowLeft className="size-4" /> All projects
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <OrgThumb name={sub.org.name} slug={sub.org.slug} size={64} className="h-16 w-16" />
          <div>
            <h1 className="text-[28px] font-semibold leading-tight text-ink">{sub.task.title}</h1>
            <p className="mt-1 text-[15px] font-medium text-ink">{sub.org.name}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill status={sub.status} />
          <p className="text-xs text-meta">Est {formatHours(sub.task.est_hours)} · cap {formatHours(sub.task.max_hours)} hrs</p>
        </div>
      </div>

      {sub.status === "needs_changes" && sub.reviewer_notes && (
        <div className="mt-6 rounded-lg border border-brick/30 bg-brick-subtle p-4">
          <p className="text-sm font-medium text-brick">The reviewer asked for changes</p>
          <p className="mt-1 text-sm text-ink">{sub.reviewer_notes}</p>
        </div>
      )}

      {submittedView && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-line bg-section p-4">
          <p className="text-sm text-body">This work has been submitted. You can follow its review.</p>
          <Button asChild variant="secondary">
            <Link href={`/app/submissions/${sub.id}`}>View submission <ArrowRight /></Link>
          </Button>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-2 text-[22px] font-semibold text-ink">About this task</h2>
            <Markdown>{sub.task.instructions_md}</Markdown>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[22px] font-semibold text-ink">
              <ListChecks className="size-5 text-forest" /> Checklist
            </h2>
            <Checklist submissionId={sub.id} items={checklist} progress={progress} locked={!editable} />
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[22px] font-semibold text-ink">
              <StickyNote className="size-5 text-forest" /> Notes
            </h2>
            <Notes submissionId={sub.id} initial={sub.user_notes ?? ""} locked={!editable} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="space-y-5 rounded-lg border border-line bg-white p-5">
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink">
                <Clock className="size-4 text-forest" /> Time log
              </h2>
              <TimeLog submissionId={sub.id} sessions={sessions} locked={!editable} />
            </div>

            {editable && (
              <div className="border-t border-line pt-4">
                {canSubmit ? (
                  <Button asChild className="w-full">
                    <Link href={`/app/projects/${sub.id}/submit`}>Submit when ready <ArrowRight /></Link>
                  </Button>
                ) : (
                  <>
                    <Button disabled className="w-full">Submit when ready</Button>
                    <p className="mt-2 text-xs text-meta">
                      {!allRequiredDone && "Check off the required steps"}
                      {!allRequiredDone && !hasSession && " and "}
                      {!hasSession && "log at least one session"}
                      {" to submit."}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
