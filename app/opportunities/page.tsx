import { SearchX, Sprout } from "lucide-react";
import { listActiveTasks } from "@/lib/queries";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { TaskFilters } from "@/components/task-filters";
import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Volunteer opportunities — Tended" };

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ loc?: string; cat?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const { t: tr } = await getDict();
  const all = await listActiveTasks();

  const counts = { location: {} as Record<string, number>, category: {} as Record<string, number> };
  for (const t of all) {
    counts.location[t.location_kind] = (counts.location[t.location_kind] ?? 0) + 1;
    counts.category[t.category] = (counts.category[t.category] ?? 0) + 1;
  }

  const loc = new Set((sp.loc ?? "").split(",").filter(Boolean));
  const cat = new Set((sp.cat ?? "").split(",").filter(Boolean));
  const q = (sp.q ?? "").trim().toLowerCase();

  const filtered = all.filter((t) => {
    if (loc.size && !loc.has(t.location_kind)) return false;
    if (cat.size && !cat.has(t.category)) return false;
    if (q && !(`${t.title} ${t.short_description} ${t.org.name}`.toLowerCase().includes(q))) return false;
    return true;
  });

  const cards: ListingCardData[] = filtered.map((t, i) => ({
    id: t.id,
    href: `/opportunities/${t.id}`,
    title: t.title,
    orgName: t.org.name,
    orgSlug: t.org.slug,
    category: t.category,
    location: t.location_kind,
    createdAt: t.created_at,
    featured: i === 0,
  }));

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-6 md:py-14">
          <div className="mx-auto max-w-[720px] text-center">
            <h1 className="text-[32px] font-semibold leading-tight text-ink md:text-[40px]">Volunteer opportunities</h1>
            <p className="mt-3 text-body">Real civic work — counting street trees, translating flyers, mapping sidewalk hazards. Free to start, no sign-in required to browse.</p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="lg:border-r lg:border-line lg:pr-6">
              <TaskFilters counts={counts} variant="sidebar" />
            </aside>

            <div>
              <div className="flex items-center justify-between border-b border-line pb-3">
                <p className="text-sm text-body">
                  {filtered.length} {filtered.length === 1 ? tr.app.tasks.opportunity : tr.app.tasks.opportunities}
                </p>
                <span className="text-sm text-meta">Most recent</span>
              </div>

              {cards.length === 0 ? (
                all.length === 0 ? (
                  <EmptyState
                    icon={<Sprout />}
                    title="No opportunities open right now"
                    body="New civic tasks from sponsoring nonprofits are posted regularly. Check back soon — or see how Tended works in the meantime."
                    ctaLabel="How Tended works"
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
                <div className="mt-1">
                  {cards.map((c) => (
                    <ListingCard key={c.id} task={c} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
