import { SearchX, Sprout } from "lucide-react";
import { listActiveTasks } from "@/lib/queries";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { TaskFilters } from "@/components/task-filters";
import { EmptyState } from "@/components/empty-state";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tasks — Tended" };

export default async function TasksPage({
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
    href: `/app/tasks/${t.id}`,
    title: t.title,
    orgName: t.org.name,
    orgSlug: t.org.slug,
    category: t.category,
    location: t.location_kind,
    createdAt: t.created_at,
    featured: i === 0,
  }));

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)_240px]">
      <aside className="lg:border-r lg:border-line lg:pr-6">
        <TaskFilters counts={counts} variant="sidebar" />
      </aside>

      <div>
        <div>
        <h1 className="service-heading text-3xl">{tr.app.tasks.title}</h1>
        <p className="mt-1 text-body">{tr.app.tasks.subhead}</p>
        </div>

      <div className="mt-8 flex items-center justify-between border-b border-line pb-3">
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
            ctaHref="/app/tasks"
          />
        )
      ) : (
        <div className="mt-1">
          {cards.map((c) => (
            <ListingCard key={c.id} task={c} showBookmark />
          ))}
        </div>
      )}
      </div>

      <aside className="hidden space-y-4 lg:block">
        <div className="service-panel p-5">
          <p className="text-sm font-semibold text-ink">Your civic work</p>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-semibold text-navy">{filtered.length}</p>
            <p className="text-sm font-medium text-body">open {filtered.length === 1 ? tr.app.tasks.opportunity : tr.app.tasks.opportunities}</p>
          </div>
          <p className="mt-1 text-sm text-body">Choose a task to begin a project.</p>
        </div>
        <div className="rounded-md border border-teal/20 bg-teal-subtle p-4">
          <p className="text-sm font-semibold text-ink">Need a hand?</p>
          <p className="mt-1 text-sm text-body">Read task instructions before committing.</p>
        </div>
      </aside>
    </div>
  );
}
