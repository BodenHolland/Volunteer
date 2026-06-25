import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertCircle, ArrowLeft, AlertTriangle } from "lucide-react";
import { requireRecipient } from "@/lib/session";
import { getSubmission } from "@/lib/queries";
import { submitWork } from "@/app/app/projects/[id]/submit-actions";
import { PhotoUpload } from "@/components/submit/photo-upload";
import { EmsRateForm } from "@/components/submit/ems-rate-form";
import { SubmitButton } from "@/components/submit/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { parseJson, totalLoggedHours, type DeliverableSpec, type EmsRateData, type TimeLogSession } from "@/lib/types";
import { formatHours } from "@/lib/time";
import { getDict } from "@/lib/i18n";
import type { AiVerdict } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const metadata = { title: "Submit work | colift" };

export default async function SubmitPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorParam } = await searchParams;
  const user = await requireRecipient();
  const sub = await getSubmission(id);
  if (!sub) notFound();
  if (sub.user_id !== user.id) redirect("/unauthorized");
  // External-certificate flow has its own submit form; redirect before showing
  // the generic photo-upload UI that doesn't apply here.
  if (sub.task.evidence_mode === "external_certificate") {
    redirect(`/app/external/${id}/submit`);
  }
  if (!["committed", "in_progress", "needs_changes"].includes(sub.status)) redirect(`/app/submissions/${id}`);

  const spec = parseJson<DeliverableSpec>(sub.task.deliverable_spec_json, { kind: sub.task.category });
  const logged = totalLoggedHours(parseJson<TimeLogSession[]>(sub.time_log_json, []));
  const overCap = logged > sub.task.max_hours;
  const cat = sub.task.category;
  const { locale, t } = await getDict();

  const aiVerdict = sub.status === "needs_changes" && sub.ai_verdict_json
    ? parseJson<AiVerdict>(sub.ai_verdict_json, null as never) as AiVerdict | null
    : null;
  const photoError = aiVerdict?.field_issues?.find((fi) => fi.field === "photos")?.message;
  const notesError = aiVerdict?.field_issues?.find((fi) => fi.field === "notes")?.message;
  const overallError = aiVerdict?.field_issues?.find((fi) => fi.field === "overall")?.message
    ?? (aiVerdict && aiVerdict.verdict !== "approve" && !photoError && !notesError ? aiVerdict.reasoning : undefined);

  return (
    <div className="mx-auto max-w-[720px]">
      <Link
        href={cat === "ems-rate-research" ? "/opportunities" : `/app/projects/${id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline"
      >
        <ArrowLeft className="size-4" /> {cat === "ems-rate-research" ? "All opportunities" : t.submitWork.backToProject}
      </Link>

      <h1 className="text-[28px] font-semibold text-ink">{t.submitWork.title}</h1>
      <p className="mt-1 text-body">{sub.task.title} · {sub.org.name}</p>

      {errorParam === "incomplete" && (
        <div className="mt-4 rounded-lg border border-brick/40 bg-brick-subtle p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-brick" aria-hidden="true" />
            <p className="text-sm font-semibold text-brick">Address every rate before submitting</p>
          </div>
          <p className="mt-1 text-sm text-ink">
            For each rate (BLS, ALS, mileage, TNT) either enter the dollar amount with its source URL,
            or check &ldquo;Couldn&apos;t find&rdquo;. At least one rate must be filled in.
          </p>
        </div>
      )}

      {aiVerdict && (
        <div className="mt-4 rounded-lg border border-brick/40 bg-brick-subtle p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-brick" aria-hidden="true" />
            <p className="text-sm font-semibold text-brick">Your submission needs a few fixes</p>
          </div>
          <p className="mt-1 text-sm text-ink">{aiVerdict.reasoning}</p>
          {aiVerdict.issues.length > 0 && (
            <ul className="mt-2 ml-4 list-disc text-sm text-body">
              {aiVerdict.issues.map((issue, i) => <li key={i}>{issue}</li>)}
            </ul>
          )}
          {overallError && !aiVerdict.issues.length && (
            <p className="mt-1 text-sm text-body">{overallError}</p>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 rounded-lg border border-line bg-section p-4 text-sm">
        <span className="text-body">{t.submitWork.estimated} <strong className="text-ink">{formatHours(sub.task.est_hours)}h</strong></span>
        <span className="text-body">{t.submitWork.logged} <strong className="text-ink">{formatHours(logged)}h</strong></span>
        <span className="text-body">{t.submitWork.cap} <strong className="text-ink">{formatHours(sub.task.max_hours)}h</strong></span>
      </div>
      {overCap && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-amber">
          <AlertTriangle className="size-4" /> {t.submitWork.overCapPre} {formatHours(sub.task.max_hours)}{t.submitWork.overCapPost}
        </p>
      )}

      <form action={submitWork} className="mt-6 space-y-6" encType="multipart/form-data">
        <input type="hidden" name="submission_id" value={id} />

        {(cat === "data-collection") && (
          <div className="space-y-2">
            <Label>{t.submitWork.photos} {spec.min_photos ? `(${t.submitWork.atLeast.replace("{n}", String(spec.min_photos))})` : ""}</Label>
            <PhotoUpload min={spec.min_photos ?? 1} copy={{ add: t.submitWork.addPhotos, atLeast: t.submitWork.atLeastN, noGeotag: t.submitWork.noGeotag, addAtLeast: t.submitWork.addAtLeast }} error={photoError} />
            <div className="space-y-1.5 pt-2">
              <Label htmlFor="content" className={notesError ? "text-brick" : undefined}>{t.submitWork.notes}</Label>
              <Textarea id="content" name="content" defaultValue={sub.user_notes ?? ""} placeholder={t.submitWork.dataNotesPlaceholder} className={notesError ? "border-brick focus-visible:ring-brick" : undefined} />
              {notesError && <p className="flex items-center gap-1.5 text-sm text-brick"><AlertCircle className="size-4 shrink-0" />{notesError}</p>}
            </div>
          </div>
        )}

        {cat === "translation" && (
          <div className="space-y-4">
            <div className="rounded-md border border-line bg-section p-4 text-sm text-body">
              <p className="mb-1 font-medium text-ink">{t.submitWork.sourceEnglish}</p>
              <p>Free flu shots are available at all county public health clinics this fall. No appointment or insurance is required. Bring photo ID if you have one. Clinics are open weekdays 9am5pm. For locations, call your county health line.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content" className={notesError ? "text-brick" : undefined}>{t.submitWork.yourSpanish}</Label>
              <Textarea id="content" name="content" className={`min-h-[180px]${notesError ? " border-brick focus-visible:ring-brick" : ""}`} defaultValue={sub.user_notes ?? ""} placeholder={t.submitWork.spanishPlaceholder} />
              {notesError && <p className="flex items-center gap-1.5 text-sm text-brick"><AlertCircle className="size-4 shrink-0" />{notesError}</p>}
            </div>
          </div>
        )}

        {cat === "neighborhood-writing" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="content" className={notesError ? "text-brick" : undefined}>{t.submitWork.yourWriteup} {spec.min_words ? `(${t.submitWork.atLeastWords.replace("{n}", String(spec.min_words))})` : ""}</Label>
              <Textarea id="content" name="content" className={`min-h-[200px]${notesError ? " border-brick focus-visible:ring-brick" : ""}`} defaultValue={sub.user_notes ?? ""} placeholder={t.submitWork.writeupPlaceholder} />
              {notesError && <p className="flex items-center gap-1.5 text-sm text-brick"><AlertCircle className="size-4 shrink-0" />{notesError}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t.submitWork.photo}</Label>
              <PhotoUpload min={spec.min_photos ?? 1} copy={{ add: t.submitWork.addPhotos, atLeast: t.submitWork.atLeastN, noGeotag: t.submitWork.noGeotag, addAtLeast: t.submitWork.addAtLeast }} error={photoError} />
            </div>
          </div>
        )}

        {cat === "civic-input" && (
          <div className="space-y-4">
            {spec.survey?.map((q) => (
              <div key={q.id} className="space-y-1.5">
                <Label>{q.question}</Label>
                {q.kind === "rank" && q.options && (
                  <ol className="ml-5 list-decimal text-sm text-body">{q.options.map((o) => <li key={o}>{o}</li>)}</ol>
                )}
              </div>
            ))}
            <div className="space-y-1.5">
              <Label htmlFor="content" className={notesError ? "text-brick" : undefined}>{t.submitWork.yourRanking}</Label>
              <Textarea id="content" name="content" className={`min-h-[140px]${notesError ? " border-brick focus-visible:ring-brick" : ""}`} defaultValue={sub.user_notes ?? ""} placeholder={t.submitWork.rankingPlaceholder} />
              {notesError && <p className="flex items-center gap-1.5 text-sm text-brick"><AlertCircle className="size-4 shrink-0" />{notesError}</p>}
            </div>
          </div>
        )}

        {cat === "ems-rate-research" && (() => {
          const parsed = parseJson<Partial<EmsRateData>>(sub.user_notes ?? "", {});
          const assignment = parsed.assignment ?? null;
          const defaults = parsed.bls && parsed.als && parsed.mileage && parsed.tnt
            ? (parsed as EmsRateData)
            : null;
          return (
            <div className="space-y-6">
              <EmsRateForm assignment={assignment} defaults={defaults} />
              <div className="space-y-2">
                <Label>Screenshot of rate schedule (optional)</Label>
                <p className="text-xs text-meta">
                  Helpful as backup proof, the per-rate URLs above are the primary source.
                </p>
                <PhotoUpload
                  min={0}
                  copy={{
                    add: t.submitWork.addPhotos,
                    atLeast: "Drop a screenshot of the source page if you have one.",
                    noGeotag: t.submitWork.noGeotag,
                    addAtLeast: t.submitWork.addAtLeast,
                  }}
                  error={photoError}
                />
              </div>
            </div>
          );
        })()}

        {cat === "seminar" && (
          <div className="space-y-4">
            <label className="flex items-center gap-2.5 rounded-md border border-line p-3 text-sm">
              <input type="checkbox" required className="size-4 accent-[var(--color-forest)]" /> {t.submitWork.watchedSeminar}
            </label>
            <div className="space-y-2">
              <Label>{t.submitWork.completedWorkbook}</Label>
              <PhotoUpload min={1} copy={{ add: t.submitWork.addPhotos, atLeast: t.submitWork.atLeastN, noGeotag: t.submitWork.noGeotag, addAtLeast: t.submitWork.addAtLeast }} error={photoError} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content" className={notesError ? "text-brick" : undefined}>{t.submitWork.postSeminar}</Label>
              <Textarea id="content" name="content" className={`min-h-[140px]${notesError ? " border-brick focus-visible:ring-brick" : ""}`} defaultValue={sub.user_notes ?? ""} placeholder={t.submitWork.seminarPlaceholder} />
              {notesError && <p className="flex items-center gap-1.5 text-sm text-brick"><AlertCircle className="size-4 shrink-0" />{notesError}</p>}
            </div>
          </div>
        )}

        <SubmitButton label={t.submitWork.submitWork} pendingLabel={t.submitWork.submitting} />
        <p className="text-center text-xs text-meta">
          {t.submitWork.aiNote.replace("{org}", sub.org.name)}
        </p>
      </form>
    </div>
  );
}
