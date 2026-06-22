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
import { getLocale } from "@/lib/i18n";

const COPY = {
  en: {
    backToProject: "Back to project",
    submitYourWork: "Submit your work",
    estimated: "Estimated",
    logged: "Logged",
    cap: "Cap",
    overCapPre: "Your time exceeds the max. Hours credited will be capped at",
    overCapPost: ".",
    photos: "Photos",
    atLeast: (n: number | undefined) => (n ? `(at least ${n})` : ""),
    notes: "Notes",
    dataNotesPlaceholder: "Summarize what you logged — counts, species, locations, conditions.",
    sourceEnglish: "Source (English)",
    sourceText:
      "Free flu shots are available at all county public health clinics this fall. No appointment or insurance is required. Bring photo ID if you have one. Clinics are open weekdays 9am–5pm. For locations, call your county health line.",
    yourSpanish: "Your Spanish translation",
    spanishPlaceholder: "Escribe la traducción completa aquí…",
    yourWriteup: "Your write-up",
    atLeastWords: (n: number | undefined) => (n ? `(at least ${n} words)` : ""),
    writeupPlaceholder: "Describe the space, who uses it, what's working, and what it needs.",
    photo: "Photo",
    yourRanking: "Your ranking and reasoning",
    rankingPlaceholder: "List your ranking (1–5) and explain your top choice.",
    watchedSeminar: "I watched the full seminar video",
    completedWorkbook: "Completed workbook",
    postSeminar: "Post-seminar reflection",
    seminarPlaceholder: "What stood out? What will you do differently?",
    submitWork: "Submit work",
    submitting: "Submitting…",
    aiNotePre: "Your work goes to an AI check, then to",
    aiNotePost: "for review.",
    addPhotos: "Add photos",
    atLeastN: "At least {n}. We read location from the photo when available.",
    noGeotag: "no geotag",
    addAtLeast: "Add at least {n} photos.",
  },
  es: {
    backToProject: "Volver al proyecto",
    submitYourWork: "Envía tu trabajo",
    estimated: "Estimado",
    logged: "Registrado",
    cap: "Límite",
    overCapPre: "Tu tiempo supera el máximo. Las horas acreditadas se limitarán a",
    overCapPost: ".",
    photos: "Fotos",
    atLeast: (n: number | undefined) => (n ? `(al menos ${n})` : ""),
    notes: "Notas",
    dataNotesPlaceholder: "Resume lo que registraste — conteos, especies, ubicaciones, condiciones.",
    sourceEnglish: "Texto original (inglés)",
    sourceText:
      "Free flu shots are available at all county public health clinics this fall. No appointment or insurance is required. Bring photo ID if you have one. Clinics are open weekdays 9am–5pm. For locations, call your county health line.",
    yourSpanish: "Tu traducción al español",
    spanishPlaceholder: "Escribe la traducción completa aquí…",
    yourWriteup: "Tu redacción",
    atLeastWords: (n: number | undefined) => (n ? `(al menos ${n} palabras)` : ""),
    writeupPlaceholder: "Describe el espacio, quién lo usa, qué funciona y qué necesita.",
    photo: "Foto",
    yourRanking: "Tu clasificación y razonamiento",
    rankingPlaceholder: "Indica tu clasificación (1–5) y explica tu primera opción.",
    watchedSeminar: "Vi el video completo del seminario",
    completedWorkbook: "Cuaderno de trabajo completado",
    postSeminar: "Reflexión posterior al seminario",
    seminarPlaceholder: "¿Qué te llamó la atención? ¿Qué harás diferente?",
    submitWork: "Enviar trabajo",
    submitting: "Enviando…",
    aiNotePre: "Tu trabajo pasa por una revisión de IA y luego va a",
    aiNotePost: "para su revisión.",
    addPhotos: "Agregar fotos",
    atLeastN: "Al menos {n}. Leemos la ubicación de la foto cuando está disponible.",
    noGeotag: "sin geoetiqueta",
    addAtLeast: "Agrega al menos {n} fotos.",
  },
} as const;

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
  const locale = await getLocale();
  const c = COPY[locale];

  return (
    <div className="mx-auto max-w-[720px]">
      <Link href={`/app/projects/${id}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">
        <ArrowLeft className="size-4" /> {c.backToProject}
      </Link>

      <h1 className="text-[28px] font-semibold text-ink">{c.submitYourWork}</h1>
      <p className="mt-1 text-body">{sub.task.title} · {sub.org.name}</p>

      <div className="mt-4 flex items-center gap-4 rounded-lg border border-line bg-section p-4 text-sm">
        <span className="text-body">{c.estimated} <strong className="text-ink">{formatHours(sub.task.est_hours)}h</strong></span>
        <span className="text-body">{c.logged} <strong className="text-ink">{formatHours(logged)}h</strong></span>
        <span className="text-body">{c.cap} <strong className="text-ink">{formatHours(sub.task.max_hours)}h</strong></span>
      </div>
      {overCap && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-amber">
          <AlertTriangle className="size-4" /> {c.overCapPre} {formatHours(sub.task.max_hours)}{c.overCapPost}
        </p>
      )}

      <form action={submitWork} className="mt-6 space-y-6" encType="multipart/form-data">
        <input type="hidden" name="submission_id" value={id} />

        {(cat === "data-collection") && (
          <div className="space-y-2">
            <Label>{c.photos} {c.atLeast(spec.min_photos)}</Label>
            <PhotoUpload min={spec.min_photos ?? 1} copy={{ add: c.addPhotos, atLeast: c.atLeastN, noGeotag: c.noGeotag, addAtLeast: c.addAtLeast }} />
            <div className="space-y-1.5 pt-2">
              <Label htmlFor="content">{c.notes}</Label>
              <Textarea id="content" name="content" defaultValue={sub.user_notes ?? ""} placeholder={c.dataNotesPlaceholder} />
            </div>
          </div>
        )}

        {cat === "translation" && (
          <div className="space-y-4">
            <div className="rounded-md border border-line bg-section p-4 text-sm text-body">
              <p className="mb-1 font-medium text-ink">{c.sourceEnglish}</p>
              <p>{c.sourceText}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content">{c.yourSpanish}</Label>
              <Textarea id="content" name="content" className="min-h-[180px]" defaultValue={sub.user_notes ?? ""} placeholder={c.spanishPlaceholder} />
            </div>
          </div>
        )}

        {cat === "neighborhood-writing" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="content">{c.yourWriteup} {c.atLeastWords(spec.min_words)}</Label>
              <Textarea id="content" name="content" className="min-h-[200px]" defaultValue={sub.user_notes ?? ""} placeholder={c.writeupPlaceholder} />
            </div>
            <div className="space-y-2">
              <Label>{c.photo}</Label>
              <PhotoUpload min={spec.min_photos ?? 1} copy={{ add: c.addPhotos, atLeast: c.atLeastN, noGeotag: c.noGeotag, addAtLeast: c.addAtLeast }} />
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
              <Label htmlFor="content">{c.yourRanking}</Label>
              <Textarea id="content" name="content" className="min-h-[140px]" defaultValue={sub.user_notes ?? ""} placeholder={c.rankingPlaceholder} />
            </div>
          </div>
        )}

        {cat === "seminar" && (
          <div className="space-y-4">
            <label className="flex items-center gap-2.5 rounded-md border border-line p-3 text-sm">
              <input type="checkbox" required className="size-4 accent-[var(--color-forest)]" /> {c.watchedSeminar}
            </label>
            <div className="space-y-2">
              <Label>{c.completedWorkbook}</Label>
              <PhotoUpload min={1} copy={{ add: c.addPhotos, atLeast: c.atLeastN, noGeotag: c.noGeotag, addAtLeast: c.addAtLeast }} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content">{c.postSeminar}</Label>
              <Textarea id="content" name="content" className="min-h-[140px]" defaultValue={sub.user_notes ?? ""} placeholder={c.seminarPlaceholder} />
            </div>
          </div>
        )}

        <SubmitButton label={c.submitWork} pendingLabel={c.submitting} />
        <p className="text-center text-xs text-meta">
          {c.aiNotePre} {sub.org.name} {c.aiNotePost}
        </p>
      </form>
    </div>
  );
}
