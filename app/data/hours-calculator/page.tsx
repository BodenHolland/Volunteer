import Link from "next/link";
import { ArrowRight, AlertCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { HoursCalculator } from "./calculator";

export const metadata = {
  title: "ABAWD hours calculator — Tended",
  description:
    "How many monthly volunteer hours does a SNAP recipient need to satisfy the ABAWD work requirement in their state? Computed from current SNAP allotments and state minimum wages.",
};

export const dynamic = "force-dynamic";

export default async function HoursCalculatorPage() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="border-b border-line bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6 md:py-16">
            <h1 className="service-heading mx-auto max-w-[760px] text-center text-[36px] font-semibold leading-tight text-ink md:text-[44px]">
              How many volunteer hours does ABAWD actually require?
            </h1>
            <p className="mx-auto mt-4 max-w-[680px] text-center text-lg leading-relaxed text-body">
              The federal default is 80 hours per month — but 7 states (NY, ME, MA, VT, PA, VA, GA)
              use the SNAP workfare formula for general nonprofit volunteering, which can drop the
              requirement to as few as <span className="font-medium text-ink">10 hours</span> in New
              York City. Three more (MI, SD, AR) offer the lower formula only at state-registered
              workfare sites.
            </p>
            <div className="service-panel mx-auto mt-6 flex max-w-[760px] items-start gap-3 border-amber/40 bg-amber-subtle p-5 text-left">
              <AlertCircle
                className="mt-0.5 size-[18px] shrink-0 text-amber"
                strokeWidth={1.75}
                aria-hidden
              />
              <div className="text-sm text-body">
                <p className="font-medium text-ink">Why the hours number matters</p>
                <p className="mt-1">
                  Under 7 CFR §273.24, an ABAWD who doesn't meet the work requirement for{" "}
                  <span className="font-medium text-ink">3 months in any 36-month period</span>{" "}
                  loses SNAP benefits until they re-establish eligibility. Knowing the actual hours
                  threshold — and whether you're exempt — is the difference between keeping and
                  losing benefits.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6 md:py-16">
            <HoursCalculator />
          </div>
        </section>

        <section className="border-t border-line bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6 md:py-16">
            <h2 className="service-heading mx-auto max-w-[640px] text-center text-[26px] font-semibold leading-tight md:text-[30px]">
              80 hours sounds like a part-time job. 10 hours sounds like a Saturday.
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Federal baseline · 80 hrs/month",
                  body: "Applies in 44 jurisdictions (including MI, SD, AR for general nonprofit volunteering). The standard 20-hours-a-week ABAWD work requirement.",
                },
                {
                  title: "Workfare-formula states · varies",
                  body: "NY, ME, MA, VT, PA, VA, GA compute hours as SNAP allotment ÷ state min wage for any nonprofit volunteering. NY is the only one with sub-state regional rates (NYC/LI $17 vs upstate $15.50).",
                },
                {
                  title: "Upper bound caveat",
                  body: "Recipients with reported income receive smaller allotments and therefore owe fewer hours. Numbers shown are the max-allotment ceiling.",
                },
              ].map((card) => (
                <div key={card.title} className="service-panel p-5">
                  <h3 className="text-sm font-semibold text-ink">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-body">{card.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/opportunities">
                  Start volunteering <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/how-it-works">How SNAP hour certification works</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
