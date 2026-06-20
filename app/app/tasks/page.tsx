import { Bookmark, SearchX } from "lucide-react";
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
    estHours: t.est_hours,
    maxHours: t.max_hours,
    createdAt: t.created_at,
    featured: i === 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold text-ink">{tr.app.tasks.title}</h1>
        <p className="mt-1 text-body">{tr.app.tasks.subhead}</p>
      </div>

      <TaskFilters counts={counts} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-body">
          {filtered.length} {filtered.length === 1 ? tr.app.tasks.opportunity : tr.app.tasks.opportunities}
        </p>
        <button className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm font-medium text-forest hover:bg-section [&_svg]:size-4">
          <Bookmark /> Save Search
        </button>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title="No tasks match. Clear filters or try another category."
        />
      ) : (
        <ul className="space-y-4">
          {cards.map((c) => (
            <li key={c.id}>
              <ListingCard task={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
