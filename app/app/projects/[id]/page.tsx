import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ListChecks, Clock, StickyNote, ArrowRight, MapPin } from "lucide-react";
import { requireRecipient } from "@/lib/session";
import { getSubmission } from "@/lib/queries";
import { Markdown } from "@/components/markdown";
import { OrgThumb } from "@/components/org-thumb";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { TimeLog } from "@/components/project/time-log";
import { Checklist } from "@/components/project/checklist";
import { Notes } from "@/components/project/notes";
import { parseJson, type ChecklistItem, type ChecklistProgress, type TimeLogSession, type EmsRateAssignment } from "@/lib/types";
import { MIN_ENGAGEMENT_SECONDS } from "@/lib/engagement";
import { formatHours } from "@/lib/time";
import { getLocale } from "@/lib/i18n";

const COPY = {
  en: {
    allProjects: "All projects",
    est: "Est",
    cap: "cap",
    hrs: "hrs",
    reviewerAsked: "The reviewer asked for changes",
    submittedNote: "This work has been submitted. You can follow its review.",
    viewSubmission: "View submission",
    aboutTask: "About this task",
    checklist: "Checklist",
    notes: "Notes",
    timeLog: "Time log",
    submitWhenReady: "Submit when ready",
    checkRequired: "Check off the required steps",
    and: " and ",
    logAtLeast: (min: number) => `log at least ${min} min of active time`,
    toSubmit: " to submit.",
    checklistItem: {
      required: "required",
      optional: "optional",
    },
    notesPlaceholder: "Jot notes as you work — what you found, where you are, anything to remember.",
    saving: "Saving…",
    saved: "Saved",
    autosaves: "Autosaves when you click away.",
    timeLogActiveTime: "active time",
    timeLogSession: "session",
    timeLogSessions: "sessions",
    stopSession: "Stop session",
    startSession: "Start session",
    measuring: "Measuring active time — only counts while this tab is open and you're working.",
    onlyActive: "Only active time is credited — never idle time or estimates.",
    cancelTask: "Cancel task",
    cancelConfirm: "Remove this task from your work? Your progress on it will be deleted.",
    cancelYes: "Yes, cancel",
    cancelNo: "Keep it",
  },
  es: {
    allProjects: "Todos los proyectos",
    est: "Estimado",
    cap: "límite",
    hrs: "h",
    reviewerAsked: "El revisor pidió cambios",
    submittedNote: "Este trabajo se ha enviado. Puedes seguir su revisión.",
    viewSubmission: "Ver envío",
    aboutTask: "Acerca de esta tarea",
    checklist: "Lista de verificación",
    notes: "Notas",
    timeLog: "Registro de tiempo",
    submitWhenReady: "Enviar cuando esté listo",
    checkRequired: "Marca los pasos obligatorios",
    and: " y ",
    logAtLeast: (min: number) => `registra al menos ${min} min de tiempo activo`,
    toSubmit: " para enviar.",
    checklistItem: {
      required: "obligatorio",
      optional: "opcional",
    },
    notesPlaceholder: "Anota notas mientras trabajas — lo que encontraste, dónde estás, cualquier cosa que recordar.",
    saving: "Guardando…",
    saved: "Guardado",
    autosaves: "Se guarda automáticamente cuando haces clic fuera.",
    timeLogActiveTime: "tiempo activo",
    timeLogSession: "sesión",
    timeLogSessions: "sesiones",
    stopSession: "Detener sesión",
    startSession: "Iniciar sesión",
    measuring: "Midiendo el tiempo activo — solo cuenta mientras esta pestaña está abierta y estás trabajando.",
    onlyActive: "Solo se acredita el tiempo activo — nunca el tiempo inactivo ni las estimaciones.",
    cancelTask: "Cancelar tarea",
    cancelConfirm: "¿Quitar esta tarea de tu trabajo? Se borrará tu progreso en ella.",
    cancelYes: "Sí, cancelar",
    cancelNo: "Conservarla",
  },
} as const;

export const dynamic = "force-dynamic";

export default async function ProjectHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRecipient();
  const sub = await getSubmission(id);
  if (!sub) notFound();
  if (sub.user_id !== user.id) redirect("/unauthorized");

  // Audit-typed tasks each have their own flow — the generic project hub has
  // no audit UI. Bounce to the right place so a back-button or stale link
  // doesn't trap the volunteer on a page that can't progress the work.
  if (sub.auditId) redirect(`/app/audits/${sub.auditId}`);
  if (sub.govAuditId) {
    redirect(
      sub.govAuditStatus === "in_progress"
        ? `/app/gov-audits/${sub.govAuditId}`
        : `/app/gov-audits/${sub.govAuditId}/done`
    );
  }
  // ems-rate-research has no hub UI either — the structured form on /submit
  // is the work. Don't strand the volunteer here if they hit Back.
  if (sub.task.category === "ems-rate-research" && ["committed", "in_progress", "needs_changes"].includes(sub.status)) {
    redirect(`/app/projects/${id}/submit`);
  }

  const checklist = parseJson<ChecklistItem[]>(sub.task.checklist_json, []);
  const progress = parseJson<ChecklistProgress>(sub.checklist_progress_json, {});
  const sessions = parseJson<TimeLogSession[]>(sub.time_log_json, []);

  const editable = ["committed", "in_progress", "needs_changes"].includes(sub.status);
  const isEms = sub.task.category === "ems-rate-research";
  // Structured-form tasks (ems-rate-research) gate on the form's own validation,
  // not on the generic checklist or the active-time floor. The checklist for
  // these tasks just duplicates required form fields, and the engagement floor
  // penalizes work that happens almost entirely off-tab (reading source PDFs).
  const allRequiredDone = isEms || checklist.filter((c) => c.required).every((c) => progress[c.id]);
  const measuredSeconds = (sub as unknown as { measured_active_seconds: number }).measured_active_seconds ?? 0;
  const meetsFloor = isEms || measuredSeconds >= MIN_ENGAGEMENT_SECONDS;
  const canSubmit = editable && allRequiredDone && meetsFloor;
  const emsAssignment = isEms
    ? parseJson<{ assignment?: EmsRateAssignment }>(sub.user_notes ?? "", {}).assignment ?? null
    : null;
  const submittedView = ["submitted", "ai_reviewing", "pending_review", "approved", "rejected"].includes(sub.status);
  const locale = await getLocale();
  const c = COPY[locale];

  return (
    <div>
      <Link href="/app/projects" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">
        <ArrowLeft className="size-4" /> {c.allProjects}
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
          <p className="text-xs text-meta">{c.est} {formatHours(sub.task.est_hours)} · {c.cap} {formatHours(sub.task.max_hours)} {c.hrs}</p>
        </div>
      </div>

      {sub.status === "needs_changes" && sub.reviewer_notes && (
        <div className="mt-6 rounded-lg border border-brick/30 bg-brick-subtle p-4">
          <p className="text-sm font-medium text-brick">{c.reviewerAsked}</p>
          <p className="mt-1 text-sm text-ink">{sub.reviewer_notes}</p>
        </div>
      )}

      {submittedView && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-line bg-section p-4">
          <p className="text-sm text-body">{c.submittedNote}</p>
          <Button asChild variant="secondary">
            <Link href={`/app/submissions/${sub.id}`}>{c.viewSubmission} <ArrowRight /></Link>
          </Button>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          {emsAssignment && (
            <section className="rounded-lg border-2 border-forest bg-forest-subtle p-5">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-forest" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-forest">Your assignment</p>
                  <p className="mt-1 text-lg font-semibold text-ink">{emsAssignment.provider_name}</p>
                  <p className="text-sm text-body">{emsAssignment.city}, {emsAssignment.state}</p>
                  <p className="mt-2 text-sm text-body">
                    Find this provider&apos;s official published ambulance billing rates and record what you find on the submit form.
                  </p>
                </div>
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-2 text-[22px] font-semibold text-ink">{c.aboutTask}</h2>
            <Markdown>{sub.task.instructions_md}</Markdown>
          </section>

          {!isEms && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-[22px] font-semibold text-ink">
                <ListChecks className="size-5 text-forest" /> {c.checklist}
              </h2>
              <Checklist submissionId={sub.id} items={checklist} progress={progress} locked={!editable} copy={c.checklistItem} />
            </section>
          )}

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[22px] font-semibold text-ink">
              <StickyNote className="size-5 text-forest" /> {c.notes}
            </h2>
            <Notes submissionId={sub.id} initial={sub.user_notes ?? ""} locked={!editable} copy={{ placeholder: c.notesPlaceholder, saving: c.saving, saved: c.saved, autosaves: c.autosaves }} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="space-y-5 rounded-lg border border-line bg-white p-5">
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink">
                <Clock className="size-4 text-forest" /> {c.timeLog}
              </h2>
              <TimeLog
                submissionId={sub.id}
                sessions={sessions}
                measuredActiveSeconds={measuredSeconds}
                locked={!editable}
                mode={isEms ? "wall_clock" : "active"}
                copy={{
                  activeTime: c.timeLogActiveTime,
                  session: c.timeLogSession,
                  sessions: c.timeLogSessions,
                  stop: c.stopSession,
                  start: c.startSession,
                  measuring: c.measuring,
                  onlyActive: c.onlyActive,
                }}
              />
            </div>

            {editable && (
              <div className="border-t border-line pt-4">
                {canSubmit ? (
                  <Button asChild className="w-full">
                    <Link href={`/app/projects/${sub.id}/submit`}>{c.submitWhenReady} <ArrowRight /></Link>
                  </Button>
                ) : (
                  <>
                    <Button disabled className="w-full">{c.submitWhenReady}</Button>
                    <p className="mt-2 text-xs text-meta">
                      {!allRequiredDone && c.checkRequired}
                      {!allRequiredDone && !meetsFloor && c.and}
                      {!meetsFloor && c.logAtLeast(Math.round(MIN_ENGAGEMENT_SECONDS / 60) || 1)}
                      {c.toSubmit}
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
