import { SearchX, Sprout } from "lucide-react";
import { listActiveTasks } from "@/lib/queries";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { TaskFilters } from "@/components/task-filters";
import { OpportunitiesSearch } from "@/components/opportunities-search";
import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Volunteer | colift" };

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ loc?: string; cat?: string; q?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const { t: tr } = await getDict();
  const all = await listActiveTasks();

  const counts = {
    location: {} as Record<string, number>,
    category: {} as Record<string, number>,
    listingType: {} as Record<string, number>,
  };
  for (const t of all) {
    counts.location[t.location_kind] = (counts.location[t.location_kind] ?? 0) + 1;
    counts.category[t.category] = (counts.category[t.category] ?? 0) + 1;
    const lt = t.listing_type ?? "native";
    counts.listingType[lt] = (counts.listingType[lt] ?? 0) + 1;
  }

  const loc = new Set((sp.loc ?? "").split(",").filter(Boolean));
  const cat = new Set((sp.cat ?? "").split(",").filter(Boolean));
  const type = new Set((sp.type ?? "").split(",").filter(Boolean));
  const q = (sp.q ?? "").trim().toLowerCase();

  const filtered = all.filter((t) => {
    if (loc.size && !loc.has(t.location_kind)) return false;
    if (cat.size && !cat.has(t.category)) return false;
    if (type.size && !type.has(t.listing_type ?? "native")) return false;
    if (q && !(`${t.title} ${t.short_description} ${t.org.name}`.toLowerCase().includes(q))) return false;
    return true;
  });

  const cards: ListingCardData[] = filtered.map((t, i) => ({
    id: t.id,
    href: `/opportunities/${t.id}`,
    title: t.title,
    orgName: t.org.name,
    orgSlug: t.org.slug,
    orgLogoUrl: t.org.logo_url,
    category: t.category,
    location: t.location_kind,
    listingType: t.listing_type ?? "native",
    createdAt: t.created_at,
    closesAt: t.closes_at,
    featured: ["task_food_audit", "task_gov_audit", "task_zooniverse", "task_ems_rates"].includes(t.id),
  }));

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* ─── Search header ───────────────────────────────────────── */}
        <section className="border-b border-civic-line bg-white">
          <div className="mx-auto max-w-[1280px] px-5 pt-10 pb-6 md:px-8 md:pt-12 md:pb-8">
            <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-ink md:text-[40px]">
              Volunteer
            </h1>
            <p className="mt-2 max-w-[640px] text-body">
              Browse online tasks from nonprofits and public agencies near you.
            </p>

            <div className="mt-6">
              <OpportunitiesSearch locationCounts={counts.location} />
            </div>

            {/* Filter chip row */}
            <div className="mt-4">
              <TaskFilters
                counts={counts}
                listingTypeCounts={counts.listingType}
                variant="toolbar"
                hideSearch
              />
            </div>
          </div>
        </section>

        {/* ─── Results ─────────────────────────────────────────────── */}
        <section className="bg-white">
          <div className="mx-auto max-w-[1280px] px-5 py-8 md:px-8 md:py-10">
            <div className="flex items-center justify-between border-b border-civic-line pb-4">
              <p className="text-[15px] text-ink">
                <span className="font-semibold">{filtered.length.toLocaleString()}</span>{" "}
                <span className="text-slate">
                  {filtered.length === 1 ? tr.app.tasks.opportunity : tr.app.tasks.opportunities}
                </span>
              </p>
              <span className="text-sm text-slate">Most recent</span>
            </div>

            {cards.length === 0 ? (
              all.length === 0 ? (
                <EmptyState
                  icon={<Sprout />}
                  title="No opportunities open right now"
                  body="New civic tasks from sponsoring nonprofits are posted regularly. Check back soon, or see how colift works in the meantime."
                  ctaLabel="How colift works"
                  ctaHref="/how-it-works"
                />
              ) : (
                <EmptyState
                  icon={<SearchX />}
                  title="No tasks match your filters"
                  body="Try a different category or location, or clear your filters to see everything that's open."
                  ctaLabel="Clear filters"
                  ctaHref="/opportunities"
                />
              )
            ) : (
              <div className="mt-4">
                {cards.map((c) => (
                  <ListingCard key={c.id} task={c} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
