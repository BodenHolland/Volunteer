import Link from "next/link";
import { Gift, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { OrgThumb } from "@/components/org-thumb";
import { EmptyState } from "@/components/empty-state";
import { listPublishedDeliverables } from "@/lib/deliverables";
import { monthLabel, currentMonth } from "@/lib/time";
import { getDict } from "@/lib/i18n";
import type { TaskCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Public deliverables, free civic work | colift",
  description:
    "Browse the free, public-domain civic work produced by colift volunteers, translations, neighborhood documentation, and civic data, given away free under CC0.",
};

function snippet(text: string | null, max = 220): string {
  if (!text) return "";
  const t = text.trim();
  return t.length > max ? t.slice(0, max).trimEnd() + "…" : t;
}

function ymOf(ts: number): string {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function DeliverablesPage() {
  const deliverables = await listPublishedDeliverables();
  const { locale, t } = await getDict();

  const categoryLabel: Record<TaskCategory, string> = {
    "data-collection": t.deliverables.categoryDataCollection,
    translation: t.deliverables.categoryTranslation,
    "civic-input": t.deliverables.categoryCivicInput,
    "neighborhood-writing": t.deliverables.categoryNeighborhoodWriting,
    seminar: t.deliverables.categorySeminar,
    "food-audit": t.deliverables.categoryFoodAudit,
    "gov-audit": t.deliverables.categoryGovAudit,
    "ems-rate-research": t.deliverables.categoryEmsRateResearch,
    "community-service": t.deliverables.categoryCommunityService,
    "citizen-science": t.deliverables.categoryCitizenScience,
  };

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-6 md:py-20">
            <div className="mx-auto max-w-[720px] text-center">
              <h1 className="text-[40px] font-semibold leading-[1.1] text-ink md:text-[48px]">
                {t.deliverables.title}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-body">
                {t.deliverables.intro}{" "}
                <span className="font-medium text-ink">{t.deliverables.ccZero}</span>.
              </p>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="mx-auto max-w-[1200px] px-4 py-12 md:px-6 md:py-16">
          {deliverables.length > 0 ? (
            <>
              <p className="text-sm text-meta">
                {`${deliverables.length} ${t.deliverables.published} ${deliverables.length === 1 ? t.deliverables.deliverableOne : t.deliverables.deliverableMany}`}
              </p>
              <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {deliverables.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/deliverables/${d.id}`}
                      className="group flex h-full flex-col rounded-lg border border-line bg-white p-5 transition hover:border-forest/60 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <OrgThumb name={d.org.name} slug={d.org.slug} size={40} className="h-10 w-10" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{d.org.name}</p>
                          <p className="text-xs text-meta">{monthLabel(ymOf(d.monthTs))}</p>
                        </div>
                      </div>

                      <span className="mt-4 inline-flex w-fit items-center rounded-full border border-line bg-section px-2.5 py-0.5 text-xs font-medium text-body">
                        {categoryLabel[d.category] ?? d.category}
                      </span>

                      <h2 className="mt-3 text-base font-semibold leading-snug text-ink">{d.taskTitle}</h2>

                      {d.userNotes && (
                        <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-body">
                          {snippet(d.userNotes)}
                        </p>
                      )}

                      <div className="mt-auto pt-4">
                        <p className="text-xs text-meta">{t.deliverables.freeToUse}</p>
                        <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-forest">
                          {t.deliverables.viewDeliverable}
                          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyState
              icon={<Gift />}
              title={t.deliverables.emptyTitle}
              body={`${t.deliverables.emptyBody} ${monthLabel(currentMonth())}.`}
            />
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
