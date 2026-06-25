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
import { ExternalEvidence } from "@/components/org/external-evidence";
import { ExternalReviewActions } from "@/components/org/external-review-actions";
import { remainingMonthlyMinutes } from "@/lib/zooniverse";
import { parseJson } from "@/lib/types";
import type { AiVerdict } from "@/lib/ai";
import type { FlagKind } from "@/lib/fraud";
import { formatHours, relativeTime } from "@/lib/time";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review submission | colift" };

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getDict();
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
  // Credit basis is measured *active* engagement (idle-aware), not wall-clock.
  const measuredSeconds = (sub as unknown as { measured_active_seconds: number }).measured_active_seconds ?? 0;
  const logged = measuredSeconds / 3600;
  const decided = ["approved", "rejected", "needs_changes"].includes(sub.status);
  const isExternal = sub.task.evidence_mode === "external_certificate";

  // External-certificate review: if the task has a monthly cap, compute the
  // remaining minutes so the reviewer sees how many are still available
  // before entering the credit. Null cap = uncapped, no math needed.
  let remainingMinutes: number | null = null;
  let defaultProjectName = "";
  let defaultProjectSlug = "";
  let defaultCreditedMinutes: number | null = null;
  if (isExternal) {
    const certMeta = files.find((f) => f.kind === "zooniverse_certificate")?.metadata_json;
    let m: {
      reporting_month?: string;
      project_name?: string;
      project_slug?: string;
      reported_hours?: number;
    } = {};
    try {
      m = JSON.parse(certMeta ?? "{}");
    } catch {
      m = {};
    }
    defaultProjectName = m.project_name ?? "";
    defaultProjectSlug = m.project_slug ?? "";
    if (typeof m.reported_hours === "number") {
      defaultCreditedMinutes = Math.round(m.reported_hours * 60);
    }
    if (!decided && sub.task.monthly_minutes_cap != null) {
      let month = m.reporting_month ?? "";
      if (!/^\d{4}-\d{2}$/.test(month)) {
        const d = new Date(sub.submitted_at ?? Date.now());
        month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      }
      remainingMinutes = await remainingMonthlyMinutes(
        sub.user_id,
        sub.task.id,
        month,
        sub.task.monthly_minutes_cap
      );
    }
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <Link href="/org/submissions" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">
        <ArrowLeft className="size-4" /> {t.reviewSubmission.backLink}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="service-heading text-3xl">{sub.task.title}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-body">
            <UserIcon className="size-4 text-meta" /> {names.get(sub.user_id) ?? t.reviewSubmission.volunteerFallback}
            <span className="text-meta">{t.reviewSubmission.submittedAt.replace("{time}", relativeTime(sub.submitted_at ?? sub.committed_at))}</span>
          </p>
        </div>
        <StatusPill status={sub.status} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <section className="service-panel p-5">
            <h2 className="mb-4 text-lg font-semibold text-ink">{t.reviewSubmission.evidenceHeading}</h2>
            {isExternal ? (
              <ExternalEvidence submission={sub} files={files} />
            ) : (
              <SubmissionContent submission={sub} task={sub.task} files={files} />
            )}
          </section>

          {(verdict || flags.length > 0) && (
            <section className="service-panel space-y-3 p-5">
              {verdict && <AiVerdictBox verdict={verdict} />}
              <div>
                <FlagChips flags={flags as { kind: FlagKind }[]} />
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          {!isExternal && (
            <div className="mb-4 rounded-lg border border-line bg-section p-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-body"><Clock className="size-4 text-meta" /> {t.reviewSubmission.activeTimeLabel}</span>
                <span className="font-medium text-ink">{formatHours(logged)}h</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-body">{t.reviewSubmission.estimatedCapLabel}</span>
                <span className="font-medium text-ink">{formatHours(sub.task.est_hours)} / {formatHours(sub.task.max_hours)}h</span>
              </div>
            </div>
          )}

          {decided ? (
            <div className="rounded-lg border border-line bg-teal-subtle p-5">
              <p className="text-sm font-medium text-ink">
                {sub.status === "approved"
                  ? t.reviewSubmission.approvedStatus.replace("{hours}", String(formatHours(sub.hours_credited ?? 0)))
                  : sub.status === "needs_changes"
                    ? t.reviewSubmission.needsChangesStatus
                    : t.reviewSubmission.rejectedStatus}
              </p>
              {sub.reviewer_notes && <p className="mt-1 text-sm text-body">{sub.reviewer_notes}</p>}
            </div>
          ) : isExternal ? (
            <ExternalReviewActions
              submissionId={sub.id}
              monthlyCapMinutes={sub.task.monthly_minutes_cap}
              remainingCapMinutes={remainingMinutes}
              defaultProjectName={defaultProjectName}
              defaultProjectSlug={defaultProjectSlug}
              defaultCreditedMinutes={defaultCreditedMinutes}
            />
          ) : (
            <ReviewActions submissionId={sub.id} measuredHours={logged} capHours={sub.task.max_hours} estHours={sub.task.est_hours} />
          )}
        </aside>
      </div>
    </div>
  );
}
