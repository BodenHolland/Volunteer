import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/lib/cf";
import { requireUser } from "@/lib/session";
import { getLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import type { AuditRow } from "@/lib/food-audit";
import { DonePolling, type DoneCopy } from "./done-polling";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit submitted — Tended" };

const COPY = {
  en: {
    overline: "Food access price audit",
    title: "Thanks — your audit is being verified.",
    body: "We're checking your photos and prices. Hours credit once verification passes — usually under a minute, though flagged audits can take 1–2 business days.",
    backToDashboard: "Back to dashboard",
    findAnother: "Find another task",
    polling: {
      verified: "Verified",
      minutesCredited: "{mins} minutes credited to your SNAP hours.",
      hoursCredited: "Hours credited.",
      pricesFlowingLead: "Your shelf prices are also flowing into",
      pricesFlowingTail: ", the global open-data food price dataset.",
      rejected: "Rejected",
      rejectedBody: "See your audit history for details.",
      flagged: "Flagged — your audit is in the human spot-review queue (1–2 business days).",
      verifying: "Verifying…",
    },
  },
  es: {
    overline: "Auditoría de precios de acceso a la comida",
    title: "Gracias — tu auditoría se está verificando.",
    body: "Estamos revisando tus fotos y precios. Las horas se acreditan en cuanto pasa la verificación — normalmente en menos de un minuto, aunque las auditorías marcadas pueden tardar 1 o 2 días hábiles.",
    backToDashboard: "Volver al panel",
    findAnother: "Buscar otra tarea",
    polling: {
      verified: "Verificada",
      minutesCredited: "{mins} minutos acreditados a tus horas de SNAP.",
      hoursCredited: "Horas acreditadas.",
      pricesFlowingLead: "Tus precios del estante también se suman a",
      pricesFlowingTail: ", el conjunto de datos abierto y global de precios de comida.",
      rejected: "Rechazada",
      rejectedBody: "Revisa tu historial de auditorías para más detalles.",
      flagged: "Marcada — tu auditoría está en la cola de revisión manual (1 o 2 días hábiles).",
      verifying: "Verificando…",
    },
  },
} as const;

export default async function AuditDonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const locale = await getLocale();
  const c = COPY[locale];
  const audit = await getDb()
    .prepare("SELECT * FROM audits WHERE id = ?")
    .bind(id)
    .first<AuditRow>();
  if (!audit) notFound();
  if (audit.user_id !== user.id) redirect("/unauthorized");

  return (
    <div className="mx-auto max-w-xl pb-24 pt-4 text-center">
      <h1 className="text-[28px] font-semibold text-ink">{c.title}</h1>
      <p className="mt-3 text-body">{c.body}</p>

      <DonePolling
        auditId={id}
        initialStatus={audit.validation_status}
        creditedHours={audit.credited_hours}
        copy={c.polling as DoneCopy}
      />

      <div className="mt-8 flex gap-3 justify-center">
        <Button asChild>
          <Link href="/app">{c.backToDashboard}</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/app/tasks">{c.findAnother}</Link>
        </Button>
      </div>
    </div>
  );
}
