import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, RotateCcw, CheckCircle2 } from "lucide-react";
import { requireRecipient } from "@/lib/session";
import { getSubmission, getSubmissionFiles, getSubmissionFlags } from "@/lib/queries";
import { StatusPill } from "@/components/status-pill";
import { OrgThumb } from "@/components/org-thumb";
import { AiPoller } from "@/components/submit/ai-poller";
import { AiVerdictBox } from "@/components/ai-verdict";
import { FlagChips } from "@/components/flag-chips";
import { SubmissionContent } from "@/components/submission-content";
import { Button } from "@/components/ui/button";
import { parseJson } from "@/lib/types";
import type { AiVerdict } from "@/lib/ai";
import type { FlagKind } from "@/lib/fraud";
import { formatHours } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Submission — Tended" };

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRecipient();
  const sub = await getSubmission(id);
  if (!sub) notFound();
  if (sub.user_id !== user.id) redirect("/unauthorized");

  const [files, flags] = await Promise.all([getSubmissionFiles(id), getSubmissionFlags(id)]);
  const verdict = sub.ai_verdict_json ? (parseJson<AiVerdict>(sub.ai_verdict_json, null as never) as AiVerdict) : null;
  const reviewing = sub.status === "ai_reviewing" || sub.status === "submitted";
  const failed = sub.status === "needs_changes" || sub.status === "rejected";

  return (
    <div className="mx-auto max-w-[760px]">
      <Link href="/app/projects" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">
        <ArrowLeft className="size-4" /> All projects
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <OrgThumb name={sub.org.name} slug={sub.org.slug} size={56} className="h-14 w-14" />
          <div>
            <h1 className="text-2xl font-semibold leading-tight text-ink">{sub.task.title}</h1>
            <p className="mt-1 text-[15px] font-medium text-ink">{sub.org.name}</p>
          </div>
        </div>
        <StatusPill status={sub.status} />
      </div>

      <div className="mt-6 space-y-6">
        {reviewing && <AiPoller submissionId={sub.id} initialStatus={sub.status} />}

        {sub.status === "approved" && (
          <div className="flex items-center gap-3 rounded-lg border border-forest/30 bg-forest-subtle p-4">
            <CheckCircle2 className="size-5 text-forest" />
            <p className="text-sm font-medium text-forest">
              Certified — {formatHours(sub.hours_credited ?? sub.task.est_hours)} hours credited toward this month.
            </p>
          </div>
        )}

        {failed && sub.reviewer_notes && (
          <div className="rounded-lg border border-brick/30 bg-brick-subtle p-4">
            <p className="text-sm font-medium text-brick">The reviewer asked for changes</p>
            <p className="mt-1 text-sm text-ink">{sub.reviewer_notes}</p>
            <Button asChild variant="secondary" className="mt-3">
              <Link href={`/app/projects/${sub.id}`}><RotateCcw /> Try again</Link>
            </Button>
          </div>
        )}

        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink">What you submitted</h2>
          <SubmissionContent submission={sub} task={sub.task} files={files} />
        </section>

        {verdict && !reviewing && (
          <section className="space-y-3">
            <AiVerdictBox verdict={verdict} />
            <div>
              <p className="overline mb-1.5">Integrity checks</p>
              <FlagChips flags={flags as { kind: FlagKind }[]} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
