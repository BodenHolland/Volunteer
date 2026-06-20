import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, User as UserIcon, Clock } from "lucide-react";
import { requireOrgMember } from "@/lib/session";
import { getSubmission, getSubmissionFiles, getSubmissionFlags, getDisplayNames } from "@/lib/queries";
import { StatusPill } from "@/components/status-pill";
import { AiVerdictBox } from "@/components/ai-verdict";
import { FlagChips } from "@/components/flag-chips";
import { SubmissionContent } from "@/components/submission-content";
import { ReviewActions } from "@/components/org/review-actions";
import { parseJson, totalLoggedHours, type TimeLogSession } from "@/lib/types";
import type { AiVerdict } from "@/lib/ai";
import type { FlagKind } from "@/lib/fraud";
import { formatHours, relativeTime } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review submission — Tended" };

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireOrgMember();
  const sub = await getSubmission(id);
  if (!sub) notFound();
  if (sub.org.id !== user.org_id) redirect("/unauthorized");

  const [files, flags, names] = await Promise.all([
    getSubmissionFiles(id),
    getSubmissionFlags(id),
    getDisplayNames([sub.user_id]),
  ]);
  const verdict = sub.ai_verdict_json ? (parseJson<AiVerdict>(sub.ai_verdict_json, null as never) as AiVerdict) : null;
  const logged = totalLoggedHours(parseJson<TimeLogSession[]>(sub.time_log_json, []));
  const decided = ["approved", "rejected", "needs_changes"].includes(sub.status);

  return (
    <div>
      <Link href="/org/submissions" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">
        <ArrowLeft className="size-4" /> Review queue
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-ink">{sub.task.title}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-body">
            <UserIcon className="size-4 text-meta" /> {names.get(sub.user_id) ?? "A volunteer"}
            <span className="text-meta">· submitted {relativeTime(sub.submitted_at ?? sub.committed_at)}</span>
          </p>
        </div>
        <StatusPill status={sub.status} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink">Submission</h2>
            <SubmissionContent submission={sub} task={sub.task} files={files} />
          </section>

          {verdict && (
            <section className="space-y-3">
              <AiVerdictBox verdict={verdict} />
              <div>
                <p className="overline mb-1.5">Integrity checks</p>
                <FlagChips flags={flags as { kind: FlagKind }[]} />
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-4 rounded-lg border border-line bg-white p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-body"><Clock className="size-4 text-meta" /> Time logged</span>
              <span className="font-medium text-ink">{formatHours(logged)}h</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-body">Estimated / cap</span>
              <span className="font-medium text-ink">{formatHours(sub.task.est_hours)} / {formatHours(sub.task.max_hours)}h</span>
            </div>
          </div>

          {decided ? (
            <div className="rounded-lg border border-line bg-section p-4">
              <p className="text-sm font-medium text-ink">
                {sub.status === "approved"
                  ? `Approved — ${formatHours(sub.hours_credited ?? 0)}h certified.`
                  : sub.status === "needs_changes"
                    ? "Sent back for changes."
                    : "Rejected."}
              </p>
              {sub.reviewer_notes && <p className="mt-1 text-sm text-body">{sub.reviewer_notes}</p>}
            </div>
          ) : (
            <ReviewActions submissionId={sub.id} measuredHours={logged} capHours={sub.task.max_hours} estHours={sub.task.est_hours} />
          )}
        </aside>
      </div>
    </div>
  );
}
