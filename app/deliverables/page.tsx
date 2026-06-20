import Link from "next/link";
import { Gift, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PilotBanner } from "@/components/pilot-banner";
import { OrgThumb } from "@/components/org-thumb";
import { EmptyState } from "@/components/empty-state";
import { listPublishedDeliverables } from "@/lib/deliverables";
import { monthLabel, currentMonth } from "@/lib/time";
import type { TaskCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Public deliverables — free civic work | Tended",
  description:
    "Browse the free, public-domain civic work produced by Tended volunteers — translations, neighborhood documentation, and civic data, given away free under CC0.",
};

const CATEGORY_LABEL: Record<TaskCategory, string> = {
  "data-collection": "Field data",
  translation: "Translation",
  "civic-input": "Civic input",
  "neighborhood-writing": "Writing",
  seminar: "Learning",
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

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <PilotBanner />
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-6 md:py-20">
            <div className="max-w-[720px]">
              <p className="overline mb-4 flex items-center gap-2">
                <Gift className="size-4 text-forest" strokeWidth={1.75} /> Free &amp; public domain
              </p>
              <h1 className="text-[40px] font-semibold leading-[1.1] text-ink md:text-[48px]">
                The work, given away free.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-body">
                Every approved task produces a real civic output — a translation, a neighborhood
                profile, civic data for a city agency. Tended never sells this work. It&apos;s donated
                to the public, libraries, and government, free to use under{" "}
                <span className="font-medium text-ink">CC0 / public domain</span>.
              </p>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="mx-auto max-w-[1200px] px-4 py-12 md:px-6 md:py-16">
          {deliverables.length > 0 ? (
            <>
              <p className="text-sm text-meta">
                {deliverables.length} published {deliverables.length === 1 ? "deliverable" : "deliverables"}
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
                        {CATEGORY_LABEL[d.category] ?? d.category}
                      </span>

                      <h2 className="mt-3 text-base font-semibold leading-snug text-ink">{d.taskTitle}</h2>

                      {d.userNotes && (
                        <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-body">
                          {snippet(d.userNotes)}
                        </p>
                      )}

                      <div className="mt-auto pt-4">
                        <p className="text-xs text-meta">Free to use — CC0 / public domain</p>
                        <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-forest">
                          View deliverable
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
              title="No published deliverables yet"
              body={`When volunteers' approved work is published, it appears here for anyone to use — free, under CC0. Check back for ${monthLabel(currentMonth())}.`}
            />
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
