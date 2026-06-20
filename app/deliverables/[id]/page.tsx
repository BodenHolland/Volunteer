import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Gift, FileText } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PilotBanner } from "@/components/pilot-banner";
import { OrgThumb } from "@/components/org-thumb";
import { getPublishedDeliverable } from "@/lib/deliverables";
import { monthLabel } from "@/lib/time";
import type { TaskCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<TaskCategory, string> = {
  "data-collection": "Field data",
  translation: "Translation",
  "civic-input": "Civic input",
  "neighborhood-writing": "Writing",
  seminar: "Learning",
};

function outputLabel(category: TaskCategory): string {
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
    title: d ? `${d.taskTitle} — free public deliverable | Tended` : "Deliverable — Tended",
  };
}

export default async function DeliverableDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getPublishedDeliverable(id);
  // notFound() if the submission isn't published (helper returns null).
  if (!d) notFound();

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <PilotBanner />
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-[820px] px-4 py-10 md:px-6 md:py-14">
          <Link
            href="/deliverables"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-body hover:text-forest"
          >
            <ArrowLeft className="size-4" /> All public deliverables
          </Link>

          {/* Header */}
          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
            <OrgThumb name={d.org.name} slug={d.org.slug} size={72} className="h-[72px] w-[72px]" />
            <div className="min-w-0">
              <span className="inline-flex w-fit items-center rounded-full border border-line bg-section px-2.5 py-0.5 text-xs font-medium text-body">
                {CATEGORY_LABEL[d.category] ?? d.category}
              </span>
              <h1 className="mt-2 text-[28px] font-semibold leading-tight text-ink md:text-[32px]">
                {d.taskTitle}
              </h1>
              <p className="mt-2 text-sm text-body">
                Sponsored by{" "}
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
              <Gift className="size-4 text-forest" strokeWidth={1.75} /> Donated free to the public
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-body">
              This work was produced by a Tended volunteer and donated free — to the public, a partner
              library, or a city agency. It is released under{" "}
              <span className="font-medium text-ink">CC0 / public domain</span>: anyone may use, share,
              or adapt it for any purpose, with no permission needed. Tended never sells volunteer work.
            </p>
          </div>

          {/* Public output (no PII — never the recipient's name) */}
          <div className="mt-8 space-y-6">
            {d.userNotes && (
              <div>
                <p className="overline mb-1.5">{outputLabel(d.category)}</p>
                <p className="whitespace-pre-wrap rounded-lg border border-line bg-white p-5 text-[15px] leading-relaxed text-ink">
                  {d.userNotes}
                </p>
              </div>
            )}

            {d.files.length > 0 && (
              <div>
                <p className="overline mb-1.5 flex items-center gap-1.5">
                  <FileText className="size-3.5" /> {d.files.length} photo
                  {d.files.length === 1 ? "" : "s"}
                </p>
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
              <p className="text-sm text-meta">No public content attached.</p>
            )}
          </div>

          <p className="mt-10 text-xs text-meta">
            Free to use — CC0 / public domain. Pilot demo — partnerships shown are illustrative.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
