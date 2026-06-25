import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, RotateCcw, CheckCircle2, MapPin } from "lucide-react";
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
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Submission — colift" };

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRecipient();
  const sub = await getSubmission(id);
  if (!sub) notFound();
  if (sub.user_id !== user.id) redirect("/unauthorized");

  // Audit-typed tasks have their own detail/done routes — bounce stale links.
  if (sub.auditId) redirect(`/app/audits/${sub.auditId}`);
  if (sub.task.evidence_mode === "external_certificate") {
    redirect(`/app/external/${id}`);
  }
  if (sub.govAuditId) {
    redirect(
      sub.govAuditStatus === "in_progress"
        ? `/app/gov-audits/${sub.govAuditId}`
        : `/app/gov-audits/${sub.govAuditId}/done`
    );
  }

  const [files, flags] = await Promise.all([getSubmissionFiles(id), getSubmissionFlags(id)]);
  const verdict = sub.ai_verdict_json ? (parseJson<AiVerdict>(sub.ai_verdict_json, null as never) as AiVerdict) : null;
  const reviewing = sub.status === "ai_reviewing" || sub.status === "submitted";
  const failed = sub.status === "needs_changes" || sub.status === "rejected";
  const isEms = sub.task.category === "ems-rate-research";
  const showEmsCta = isEms && !failed && sub.status !== "committed" && sub.status !== "in_progress";
  const { locale, t } = await getDict();

  return (
    <div className="mx-auto max-w-[760px]">
      <Link href="/app/projects" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">
        <ArrowLeft className="size-4" /> {t.submissionDetail.allProjects}
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

        {showEmsCta && (
          <div className="rounded-lg border-2 border-forest bg-forest-subtle p-5">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-forest" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">{t.submissionDetail.emsThanks}</p>
                <p className="mt-1 text-sm text-body">{t.submissionDetail.emsNext}</p>
                <Button asChild className="mt-3">
                  <Link href={`/app/tasks/${sub.task.id}`}>{t.submissionDetail.emsCta}</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {sub.status === "approved" && (
          <div className="flex items-center gap-3 rounded-lg border border-forest/30 bg-forest-subtle p-4">
            <CheckCircle2 className="size-5 text-forest" />
            <p className="text-sm font-medium text-forest">
              {t.submissionDetail.certifiedPre} {formatHours(sub.hours_credited ?? sub.task.est_hours)} {t.submissionDetail.certifiedPost}
            </p>
          </div>
        )}

        {failed && sub.reviewer_notes && (
          <div className="rounded-lg border border-brick/30 bg-brick-subtle p-4">
            <p className="text-sm font-medium text-brick">{t.submissionDetail.reviewerAsked}</p>
            <p className="mt-1 text-sm text-ink">{sub.reviewer_notes}</p>
            <Button asChild variant="secondary" className="mt-3">
              <Link href={`/app/projects/${sub.id}/submit`}><RotateCcw /> {t.submissionDetail.tryAgain}</Link>
            </Button>
          </div>
        )}
        {failed && !sub.reviewer_notes && verdict && (
          <div className="rounded-lg border border-brick/30 bg-brick-subtle p-4">
            <p className="text-sm font-medium text-brick">{t.submissionDetail.aiAsked}</p>
            <p className="mt-1 text-sm text-ink">{verdict.reasoning}</p>
            {verdict.issues.length > 0 && (
              <ul className="mt-2 ml-4 list-disc text-sm text-body">
                {verdict.issues.map((issue, i) => <li key={i}>{issue}</li>)}
              </ul>
            )}
            <Button asChild variant="secondary" className="mt-3">
              <Link href={`/app/projects/${sub.id}/submit`}><RotateCcw /> {t.submissionDetail.fixAndResubmit}</Link>
            </Button>
          </div>
        )}

        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink">{t.submissionDetail.whatYouSubmitted}</h2>
          <SubmissionContent submission={sub} task={sub.task} files={files} />
        </section>

        {verdict && !reviewing && (
          <section className="space-y-3">
            <AiVerdictBox verdict={verdict} />
            <div>
              <FlagChips flags={flags as { kind: FlagKind }[]} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
