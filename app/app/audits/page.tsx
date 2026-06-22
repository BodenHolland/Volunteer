import Link from "next/link";
import { ClipboardList, ArrowRight, ExternalLink, Store } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { getLocale } from "@/lib/i18n";
import { relativeTime } from "@/lib/time";
import { OPEN_PRICES_PROJECT_TAG } from "@/lib/open-prices";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "My food audits — Tended" };

const COPY = {
  en: {
    title: "My food audits",
    introLead: "Every verified audit also flows into",
    introTail: ", the global open-data food-price dataset.",
    findAudit: "Find a food audit",
    emptyTitle: "No food audits yet",
    emptyBody:
      "Pick up a food-price audit, visit any store, and log shelf prices for six basket items — about 12 minutes.",
    draftAudit: "Draft audit",
    inProgress: "In progress",
    minCredited: "min credited",
    sentToOpenPrices: "sent to Open Prices",
    status: {
      draft: "Draft",
      submitted: "Submitted",
      validating: "Reviewing",
      pending_review: "Awaiting review",
      approved: "Certified",
      rejected: "Needs another try",
      needs_changes: "Needs changes",
    } as Record<string, string>,
  },
  es: {
    title: "Mis auditorías de comida",
    introLead: "Cada auditoría verificada también se suma a",
    introTail: ", el conjunto de datos abierto y global de precios de comida.",
    findAudit: "Buscar una auditoría",
    emptyTitle: "Aún no tienes auditorías",
    emptyBody:
      "Toma una auditoría de precios, visita cualquier tienda y registra los precios de seis productos de la canasta — unos 12 minutos.",
    draftAudit: "Borrador de auditoría",
    inProgress: "En progreso",
    minCredited: "min acreditados",
    sentToOpenPrices: "enviados a Open Prices",
    status: {
      draft: "Borrador",
      submitted: "Enviada",
      validating: "Revisando",
      pending_review: "Esperando revisión",
      approved: "Certificada",
      rejected: "Necesita otro intento",
      needs_changes: "Necesita cambios",
    } as Record<string, string>,
  },
} as const;

interface AuditMineRow {
  id: string;
  validation_status: string;
  submitted_at: number | null;
  credited_hours: number | null;
  store_name: string | null;
  store_address: string | null;
  sent_contribs: number;
  total_contribs: number;
}

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-section text-ink",
  submitted: "bg-amber-subtle text-amber",
  validating: "bg-amber-subtle text-amber",
  pending_review: "bg-amber-subtle text-amber",
  approved: "bg-forest-subtle text-forest",
  rejected: "bg-brick-subtle text-brick",
  needs_changes: "bg-brick-subtle text-brick",
};
export default async function MyAuditsPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const c = COPY[locale];
  const db = getDb();
  const rows =
    (
      await db
        .prepare(
          `SELECT a.id, a.validation_status, a.submitted_at, a.credited_hours,
                  s.name AS store_name, s.address AS store_address,
                  COALESCE(SUM(CASE WHEN c.status = 'sent' THEN 1 ELSE 0 END), 0) AS sent_contribs,
                  COUNT(c.id) AS total_contribs
           FROM audits a
           LEFT JOIN stores s ON s.id = a.store_id
           LEFT JOIN open_prices_contributions c ON c.audit_id = a.id
           WHERE a.user_id = ?
           GROUP BY a.id
           ORDER BY COALESCE(a.submitted_at, a.started_at) DESC
           LIMIT 100`
        )
        .bind(user.id)
        .all<AuditMineRow>()
    ).results ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold text-ink">{c.title}</h1>
          <p className="mt-1 max-w-prose text-body">
            {c.introLead}{" "}
            <a
              href={`https://prices.openfoodfacts.org/?project=${OPEN_PRICES_PROJECT_TAG}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-forest underline-offset-2 hover:underline"
            >
              Open Prices
              <ExternalLink className="ml-0.5 inline size-3.5 align-[-1px]" aria-hidden />
            </a>
            {c.introTail}
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/app/tasks">{c.findAudit} <ArrowRight /></Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<ClipboardList />}
          title={c.emptyTitle}
          body={c.emptyBody}
          ctaLabel={c.findAudit}
          ctaHref="/app/tasks"
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/app/audits/${r.id}`}
                className="flex items-center gap-4 rounded-lg border border-line bg-white p-4 transition-colors hover:bg-section hover:shadow-sm"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-forest-subtle text-forest">
                  <Store className="size-5" strokeWidth={1.75} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{r.store_name ?? c.draftAudit}</p>
                  <p className="truncate text-sm text-body">{r.store_address ?? c.inProgress}</p>
                  {(r.credited_hours != null || r.total_contribs > 0) && (
                    <p className="mt-0.5 text-xs text-meta">
                      {r.credited_hours != null ? `${(r.credited_hours * 60).toFixed(0)} ${c.minCredited}` : ""}
                      {r.credited_hours != null && r.total_contribs > 0 ? " · " : ""}
                      {r.total_contribs > 0 ? `${r.sent_contribs}/${r.total_contribs} ${c.sentToOpenPrices}` : ""}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-medium",
                    STATUS_STYLE[r.validation_status] ?? "bg-section text-ink"
                  )}
                >
                  {c.status[r.validation_status] ?? r.validation_status}
                </span>
                <div className="hidden shrink-0 text-right text-xs text-meta sm:block">
                  {r.submitted_at ? relativeTime(r.submitted_at) : "—"}
                </div>
                <ArrowRight className="size-4 shrink-0 text-meta" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
