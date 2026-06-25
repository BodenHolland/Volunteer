import Link from "next/link";
import { ArrowRight, AlertCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { HoursCalculator } from "./calculator";
import { getDict } from "@/lib/i18n";

export const metadata = {
  title: "ABAWD hours calculator — colift",
  description:
    "How many monthly volunteer hours does a SNAP recipient need to satisfy the ABAWD work requirement in their state? Computed from current SNAP allotments and state minimum wages.",
};

export const dynamic = "force-dynamic";

export default async function HoursCalculatorPage() {
  const { t } = await getDict();
  return (
    <>
      <a href="#main" className="skip-link">{t.hoursCalculator.skipToContent}</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="border-b border-line bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6 md:py-16">
            <h1 className="service-heading mx-auto max-w-[760px] text-center text-[36px] font-semibold leading-tight text-ink md:text-[44px]">
              {t.hoursCalculator.title}
            </h1>
            <p className="mx-auto mt-4 max-w-[680px] text-center text-lg leading-relaxed text-body">
              {t.hoursCalculator.intro}{" "}
              <span className="font-medium text-ink">{t.hoursCalculator.introHighlight}</span>{" "}
              {t.hoursCalculator.introSuffix}
            </p>
            <div className="service-panel mx-auto mt-6 flex max-w-[760px] items-start gap-3 border-amber/40 bg-amber-subtle p-5 text-left">
              <AlertCircle
                className="mt-0.5 size-[18px] shrink-0 text-amber"
                strokeWidth={1.75}
                aria-hidden
              />
              <div className="text-sm text-body">
                <p className="font-medium text-ink">{t.hoursCalculator.alertTitle}</p>
                <p className="mt-1">
                  {t.hoursCalculator.alertBody}{" "}
                  <span className="font-medium text-ink">{t.hoursCalculator.alertHighlight}</span>{" "}
                  {t.hoursCalculator.alertBodySuffix}
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
              {t.hoursCalculator.comparisonTitle}
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: t.hoursCalculator.card0Title,
                  body: t.hoursCalculator.card0Body,
                },
                {
                  title: t.hoursCalculator.card1Title,
                  body: t.hoursCalculator.card1Body,
                },
                {
                  title: t.hoursCalculator.card2Title,
                  body: t.hoursCalculator.card2Body,
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
                  {t.hoursCalculator.ctaVolunteer} <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/how-it-works">{t.hoursCalculator.ctaHowItWorks}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
