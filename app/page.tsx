import Link from "next/link";
import { ArrowRight, Trees, FileCheck2, Users, Languages, MapPinned, NotebookPen } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PilotBanner } from "@/components/pilot-banner";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Tended — Real civic work for your neighborhood" };

const FEATURES = [
  {
    icon: Trees,
    title: "Real civic work",
    body: "Translate flyers, count trees, document sidewalk hazards. Your work feeds back into SF nonprofits and city agencies that need it.",
  },
  {
    icon: FileCheck2,
    title: "Hours that count",
    body: "Each task is timed and reviewed by a sponsoring nonprofit. If you receive CalFresh, your approved hours generate a pre-filled CF 888 — the form you upload to BenefitsCal.",
  },
  {
    icon: Users,
    title: "Built with neighbors",
    body: "A pilot built alongside SF nonprofits and community partners to meet the new ABAWD work requirement that started June 1, 2026.",
  },
];

export default function LandingPage() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <PilotBanner />
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-20 md:px-6 md:py-28">
            <div className="max-w-[720px]">
              <p className="overline mb-4">A civic-work pilot for San Francisco</p>
              <h1 className="text-[44px] font-semibold leading-[1.1] text-ink md:text-[52px]">
                Real civic work for your neighborhood.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-body">
                Pick a task. Help your community. The hours add up — and if you receive CalFresh, they
                can count toward your monthly work requirement.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg"><Link href="/app/tasks">See available tasks <ArrowRight /></Link></Button>
                <Button asChild size="lg" variant="secondary"><Link href="/start">Sign in</Link></Button>
              </div>
              <p className="mt-6 text-[15px]">
                <Link href="/how-it-works#calfresh" className="font-medium text-forest hover:underline">
                  Receiving CalFresh? Learn how to certify your hours →
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Sample task strip */}
        <section className="border-y border-line bg-white">
          <div className="mx-auto flex max-w-[1200px] flex-wrap gap-3 px-4 py-6 md:px-6">
            {[
              { icon: Trees, t: "Count street trees" },
              { icon: Languages, t: "Translate a flyer" },
              { icon: MapPinned, t: "Map sidewalk hazards" },
              { icon: NotebookPen, t: "Document a community space" },
            ].map((s) => (
              <span key={s.t} className="inline-flex items-center gap-2 rounded-full border border-line bg-section px-3.5 py-2 text-sm font-medium text-ink [&_svg]:size-4 [&_svg]:text-forest">
                <s.icon /> {s.t}
              </span>
            ))}
          </div>
        </section>

        {/* Feature blocks */}
        <section className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-24">
          <div className="grid gap-8 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <div className="flex size-12 items-center justify-center rounded-lg bg-forest-subtle text-forest">
                  <f.icon className="size-6" strokeWidth={1.5} />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-ink">{f.title}</h2>
                <p className="mt-2 leading-relaxed text-body">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Org CTA */}
        <section className="bg-section">
          <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 px-4 py-12 md:flex-row md:items-center md:px-6">
            <div>
              <h2 className="text-[22px] font-semibold text-ink">Run a nonprofit, school, or agency?</h2>
              <p className="mt-1 text-body">Host civic tasks and certify volunteer hours for the people you serve.</p>
            </div>
            <Button asChild variant="secondary"><Link href="/for-organizations">Become a partner <ArrowRight /></Link></Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
