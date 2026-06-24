import { notFound } from "next/navigation";
import { MapPin, Info } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { OrgThumb } from "@/components/org-thumb";
import { Markdown } from "@/components/markdown";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { EmptyState } from "@/components/empty-state";
import { getDb } from "@/lib/cf";
import { getOrgBySlug } from "@/lib/queries";
import { getLocale } from "@/lib/i18n";
import { parseJson, type Address, type TaskTemplate } from "@/lib/types";

export const dynamic = "force-dynamic";

const COPY = {
  en: {
    openTasks: "Open civic tasks",
    noTasksTitle: "No open tasks right now",
    noTasksBody:
      "This organization doesn't have any active tasks at the moment. Check back soon.",
    about: "About",
    noDescription: "This organization hasn't added a description yet.",
  },
  es: {
    openTasks: "Tareas cívicas abiertas",
    noTasksTitle: "No hay tareas abiertas en este momento",
    noTasksBody:
      "Esta organización no tiene tareas activas por ahora. Vuelve a consultar pronto.",
    about: "Acerca de",
    noDescription: "Esta organización aún no ha agregado una descripción.",
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  return { title: org ? `${org.name} — Tended` : "Organization — Tended" };
}

export default async function OrgProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) notFound();

  const tasks =
    (await getDb()
      .prepare("SELECT * FROM task_templates WHERE org_id = ? AND status = 'active' ORDER BY created_at DESC")
      .bind(org.id)
      .all<TaskTemplate>()).results ?? [];

  const cards: ListingCardData[] = tasks.map((t: TaskTemplate) => ({
    id: t.id,
    href: `/tasks/${t.id}/preview`,
    title: t.title,
    orgName: org.name,
    orgSlug: org.slug,
    category: t.category,
    location: t.location_kind,
    createdAt: t.created_at,
  }));

  const address = parseJson<Address | null>(org.address_json, null);
  const locale = await getLocale();
  const c = COPY[locale];

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6 md:py-16">
          {/* Header */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <OrgThumb name={org.name} slug={org.slug} size={96} className="h-24 w-24" />
            <div className="min-w-0">
              <h1 className="text-[32px] font-semibold leading-tight text-ink">{org.name}</h1>
              {address && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-body">
                  <MapPin className="size-4 text-meta" strokeWidth={1.5} />
                  {[address.line1, address.line2, address.city, address.state, address.zip]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>
          </div>

          <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_320px]">
            {/* Tasks */}
            <div className="min-w-0 lg:order-2 lg:col-start-1">
              <h2 className="text-[22px] font-semibold text-ink">{c.openTasks}</h2>
              {cards.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {cards.map((card) => (
                    <ListingCard key={card.id} task={card} />
                  ))}
                </div>
              ) : (
                <div className="mt-5">
                  <EmptyState
                    icon={<Info />}
                    title={c.noTasksTitle}
                    body={c.noTasksBody}
                  />
                </div>
              )}
            </div>

            {/* About */}
            <aside className="lg:order-1 lg:col-start-2 lg:row-start-1">
              <div className="rounded-lg border border-line bg-white p-5">
                <h2 className="text-base font-semibold text-ink">{c.about}</h2>
                <div className="mt-3">
                  {org.about_md ? (
                    <Markdown>{org.about_md}</Markdown>
                  ) : (
                    <p className="text-sm text-body">{c.noDescription}</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
