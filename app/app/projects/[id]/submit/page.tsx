import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { requireRecipient } from "@/lib/session";
import { getSubmission } from "@/lib/queries";
import { submitWork } from "@/app/app/projects/[id]/submit-actions";
import { PhotoUpload } from "@/components/submit/photo-upload";
import { SubmitButton } from "@/components/submit/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { parseJson, totalLoggedHours, type DeliverableSpec, type TimeLogSession } from "@/lib/types";
import { formatHours } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Submit work — Tended" };

export default async function SubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRecipient();
  const sub = await getSubmission(id);
  if (!sub) notFound();
  if (sub.user_id !== user.id) redirect("/unauthorized");
  if (!["committed", "in_progress", "needs_changes"].includes(sub.status)) redirect(`/app/submissions/${id}`);

  const spec = parseJson<DeliverableSpec>(sub.task.deliverable_spec_json, { kind: sub.task.category });
  const logged = totalLoggedHours(parseJson<TimeLogSession[]>(sub.time_log_json, []));
  const overCap = logged > sub.task.max_hours;
  const cat = sub.task.category;

  return (
    <div className="mx-auto max-w-[720px]">
      <Link href={`/app/projects/${id}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">
        <ArrowLeft className="size-4" /> Back to project
      </Link>

      <h1 className="text-[28px] font-semibold text-ink">Submit your work</h1>
      <p className="mt-1 text-body">{sub.task.title} · {sub.org.name}</p>

      <div className="mt-4 flex items-center gap-4 rounded-lg border border-line bg-section p-4 text-sm">
        <span className="text-body">Estimated <strong className="text-ink">{formatHours(sub.task.est_hours)}h</strong></span>
        <span className="text-body">Logged <strong className="text-ink">{formatHours(logged)}h</strong></span>
        <span className="text-body">Cap <strong className="text-ink">{formatHours(sub.task.max_hours)}h</strong></span>
      </div>
      {overCap && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-amber">
          <AlertTriangle className="size-4" /> Your time exceeds the max. Hours credited will be capped at {formatHours(sub.task.max_hours)}.
        </p>
      )}

      <form action={submitWork} className="mt-6 space-y-6" encType="multipart/form-data">
        <input type="hidden" name="submission_id" value={id} />

        {(cat === "data-collection") && (
          <div className="space-y-2">
            <Label>Photos {spec.min_photos ? `(at least ${spec.min_photos})` : ""}</Label>
            <PhotoUpload min={spec.min_photos ?? 1} />
            <div className="space-y-1.5 pt-2">
              <Label htmlFor="content">Notes</Label>
              <Textarea id="content" name="content" defaultValue={sub.user_notes ?? ""} placeholder="Summarize what you logged — counts, species, locations, conditions." />
            </div>
          </div>
        )}

        {cat === "translation" && (
          <div className="space-y-4">
            <div className="rounded-md border border-line bg-section p-4 text-sm text-body">
              <p className="mb-1 font-medium text-ink">Source (English)</p>
              <p>Free flu shots are available at all county public health clinics this fall. No appointment or insurance is required. Bring photo ID if you have one. Clinics are open weekdays 9am–5pm. For locations, call your county health line.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content">Your Spanish translation</Label>
              <Textarea id="content" name="content" className="min-h-[180px]" defaultValue={sub.user_notes ?? ""} placeholder="Escribe la traducción completa aquí…" />
            </div>
          </div>
        )}

        {cat === "neighborhood-writing" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="content">Your write-up {spec.min_words ? `(at least ${spec.min_words} words)` : ""}</Label>
              <Textarea id="content" name="content" className="min-h-[200px]" defaultValue={sub.user_notes ?? ""} placeholder="Describe the space, who uses it, what's working, and what it needs." />
            </div>
            <div className="space-y-2">
              <Label>Photo</Label>
              <PhotoUpload min={spec.min_photos ?? 1} />
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
              <Label htmlFor="content">Your ranking and reasoning</Label>
              <Textarea id="content" name="content" className="min-h-[140px]" defaultValue={sub.user_notes ?? ""} placeholder="List your ranking (1–5) and explain your top choice." />
            </div>
          </div>
        )}

        {cat === "seminar" && (
          <div className="space-y-4">
            <label className="flex items-center gap-2.5 rounded-md border border-line p-3 text-sm">
              <input type="checkbox" required className="size-4 accent-[var(--color-forest)]" /> I watched the full seminar video
            </label>
            <div className="space-y-2">
              <Label>Completed workbook</Label>
              <PhotoUpload min={1} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content">Post-seminar reflection</Label>
              <Textarea id="content" name="content" className="min-h-[140px]" defaultValue={sub.user_notes ?? ""} placeholder="What stood out? What will you do differently?" />
            </div>
          </div>
        )}

        <SubmitButton label="Submit work" />
        <p className="text-center text-xs text-meta">
          Your work goes to an AI check, then to {sub.org.name} for review.
        </p>
      </form>
    </div>
  );
}
