import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Gift, FileText } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { OrgThumb } from "@/components/org-thumb";
import { getPublishedDeliverable } from "@/lib/deliverables";
import { monthLabel } from "@/lib/time";
import { getDict } from "@/lib/i18n";
import type { TaskCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<"en" | "es", Record<TaskCategory, string>> = {
  en: {
    "data-collection": "Field data",
    translation: "Translation",
    "civic-input": "Civic input",
    "neighborhood-writing": "Writing",
    seminar: "Learning",
    "food-audit": "Food prices",
    "gov-audit": "Website audit",
    "ems-rate-research": "EMS rates",
    "community-service": "Community service",
    "citizen-science": "Citizen science",
  },
  es: {
    "data-collection": "Datos de campo",
    translation: "Traducción",
    "civic-input": "Aporte cívico",
    "neighborhood-writing": "Redacción",
    seminar: "Aprendizaje",
    "food-audit": "Precios de alimentos",
    "gov-audit": "Auditoría de sitios",
    "ems-rate-research": "Tarifas de EMS",
    "community-service": "Servicio comunitario",
    "citizen-science": "Ciencia ciudadana",
  },
};

function outputLabel(category: TaskCategory, locale: string): string {
  if (locale === "es") {
    if (category === "translation") return "Traducción";
    if (category === "neighborhood-writing") return "Redacción";
    return "Notas";
  }
  if (category === "translation") return "Translation";
  if (category === "neighborhood-writing") return "Write-up";
  return "Notes";
}

function ymOf(ts: number): string {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getPublishedDeliverable(id);
  return {
    title: d ? `${d.taskTitle}, free public deliverable | colift` : "Deliverable | colift",
  };
}

export default async function DeliverableDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getPublishedDeliverable(id);
  // notFound() if the submission isn't published (helper returns null).
  if (!d) notFound();

  const { locale, t } = await getDict();

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-[820px] px-4 py-10 md:px-6 md:py-14">
          <Link
            href="/deliverables"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-body hover:text-forest"
          >
            <ArrowLeft className="size-4" /> {t.deliverableDetail.allDeliverables}
          </Link>

          {/* Header */}
          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
            <OrgThumb name={d.org.name} slug={d.org.slug} size={72} className="h-[72px] w-[72px]" />
            <div className="min-w-0">
              <span className="inline-flex w-fit items-center rounded-full border border-line bg-section px-2.5 py-0.5 text-xs font-medium text-body">
                {(CATEGORY_LABEL[locale as "en" | "es"] ?? CATEGORY_LABEL.en)[d.category] ?? d.category}
              </span>
              <h1 className="mt-2 text-[28px] font-semibold leading-tight text-ink md:text-[32px]">
                {d.taskTitle}
              </h1>
              <p className="mt-2 text-sm text-body">
                {t.deliverableDetail.sponsoredBy}{" "}
                <Link href={`/orgs/${d.org.slug}`} className="font-medium text-forest hover:underline">
                  {d.org.name}
                </Link>{" "}
                · {monthLabel(ymOf(d.monthTs))}
              </p>
            </div>
          </div>

          {/* Donation / license callout */}
          <div className="mt-8 rounded-lg border border-forest/30 bg-forest-subtle/40 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Gift className="size-4 text-forest" strokeWidth={1.75} /> {t.deliverableDetail.donatedTitle}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-body">
              {t.deliverableDetail.donatedBody1}{" "}
              <span className="font-medium text-ink">{t.deliverableDetail.ccZero}</span>{t.deliverableDetail.donatedBody2}
            </p>
          </div>

          {/* Public output (no PII, never the recipient's name) */}
          <div className="mt-8 space-y-6">
            {d.userNotes && (
              <div>
                <p className="whitespace-pre-wrap rounded-lg border border-line bg-white p-5 text-[15px] leading-relaxed text-ink">
                  {d.userNotes}
                </p>
              </div>
            )}

            {d.files.length > 0 && (
              <div>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {d.files.map((p) => (
                    <li key={p.id} className="overflow-hidden rounded-md border border-line">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/files?key=${encodeURIComponent(p.r2_key)}`}
                        alt="Public deliverable"
                        className="aspect-square w-full object-cover"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!d.userNotes && d.files.length === 0 && (
              <p className="text-sm text-meta">{t.deliverableDetail.noContent}</p>
            )}
          </div>

          <p className="mt-10 text-xs text-meta">
            {t.deliverableDetail.footer}
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
