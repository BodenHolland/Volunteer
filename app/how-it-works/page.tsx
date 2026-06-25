import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { getDict } from "@/lib/i18n";

export const metadata = { title: "Get Started | colift" };

export const dynamic = "force-dynamic";

export default async function HowItWorksPage() {
  const { locale, t } = await getDict();

  const sections = [
    { id: "civic-work", label: t.howItWorks.navOnline },
    { id: "snap", label: t.howItWorks.navSnap },
    { id: "identity", label: t.howItWorks.navIdentity },
    { id: "for-organizations", label: t.howItWorks.navForOrgs },
  ];

  const tiers = [
    { title: t.howItWorks.tier0Title, body: t.howItWorks.tier0Body },
    { title: t.howItWorks.tier1Title, body: t.howItWorks.tier1Body },
    { title: t.howItWorks.tier2Title, body: t.howItWorks.tier2Body },
    { title: t.howItWorks.tier3Title, body: t.howItWorks.tier3Body },
  ];

  const neverUse = [
    t.howItWorks.neverUse0,
    t.howItWorks.neverUse1,
    t.howItWorks.neverUse2,
    t.howItWorks.neverUse3,
    t.howItWorks.neverUse4,
  ];

  const civicChecks = [
    t.howItWorks.civicCheck0,
    t.howItWorks.civicCheck1,
    t.howItWorks.civicCheck2,
  ];

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* Header */}
        <section className="border-b border-line bg-white">
          <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-6 md:py-16">
            <div className="mx-auto max-w-[720px] text-center">
              <h1 className="service-heading text-[40px] leading-[1.1] md:text-[48px]">
                {t.howItWorks.title}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-body">
                {t.howItWorks.intro}
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          <div className="grid gap-8 py-10 lg:grid-cols-[240px_1fr] md:py-14">
            {/* Anchor nav */}
            <nav aria-label="On this page" className="service-panel h-fit p-4 lg:sticky lg:top-20 lg:self-start">
              <ul className="space-y-1">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-body hover:bg-teal-subtle hover:text-teal"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Content */}
            <div className="min-w-0 max-w-[760px] space-y-5">
              {/* Civic work */}
              <section id="civic-work" className="service-panel scroll-mt-24 p-6 md:p-8">
                <h2 className="service-heading text-[28px]">{t.howItWorks.civicHeading}</h2>
                <p className="mt-3 leading-relaxed text-body">
                  {t.howItWorks.civicPara1}
                </p>
                <p className="mt-3 leading-relaxed text-body">
                  {t.howItWorks.civicPara2}
                </p>
                <ul className="mt-5 space-y-2">
                  {civicChecks.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-body">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-forest" strokeWidth={1.5} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* SNAP */}
              <section id="snap" className="service-panel scroll-mt-24 p-6 md:p-8">
                <h2 className="service-heading text-[28px]">{t.howItWorks.snapHeading}</h2>
                <p className="mt-3 leading-relaxed text-body">
                  {t.howItWorks.snapPara1}
                </p>
                <p className="mt-3 leading-relaxed text-body">
                  {t.howItWorks.snapPara2}
                </p>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-start gap-2.5 text-body">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-forest-subtle text-xs font-semibold text-forest">1</span>
                    <span><strong className="font-semibold text-ink">{t.howItWorks.section1Label}</strong>{t.howItWorks.section1Rest}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-body">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-forest-subtle text-xs font-semibold text-forest">2</span>
                    <span><strong className="font-semibold text-ink">{t.howItWorks.section2Label}</strong>{t.howItWorks.section2Rest}</span>
                  </li>
                </ul>
                <p className="mt-4 leading-relaxed text-body">
                  {t.howItWorks.snapPara3}
                </p>
                <div className="mt-5 rounded-lg border border-line bg-amber-subtle p-4">
                  <p className="text-sm leading-relaxed text-amber">
                    {t.howItWorks.snapAmberNote}
                  </p>
                </div>
                <div className="mt-3 rounded-lg border border-line bg-forest-subtle p-4">
                  <p className="text-sm leading-relaxed text-forest">
                    {t.howItWorks.snapForestNote}
                  </p>
                </div>
              </section>

              {/* Identity & privacy */}
              <section id="identity" className="service-panel scroll-mt-24 p-6 md:p-8">
                <h2 className="service-heading text-[28px]">{t.howItWorks.identityHeading}</h2>
                <p className="mt-3 leading-relaxed text-body">
                  {t.howItWorks.identityPara1}
                </p>
                <p className="mt-3 leading-relaxed text-body">
                  {t.howItWorks.identityPara2}
                </p>
                <ol className="mt-5 space-y-3">
                  {tiers.map((tier, i) => (
                    <li key={tier.title} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-semibold text-white">{i + 1}</span>
                      <div>
                        <p className="text-sm font-semibold text-ink">{tier.title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-body">{tier.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-6 rounded-lg border border-line bg-brick-subtle p-5">
                  <p className="text-sm font-semibold text-brick">{t.howItWorks.neverUseTitle}</p>
                  <ul className="mt-3 space-y-2">
                    {neverUse.map((n) => (
                      <li key={n} className="flex items-start gap-2.5 text-sm text-body">
                        <XCircle className="mt-0.5 size-4 shrink-0 text-brick" strokeWidth={1.5} />
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* For organizations */}
              <section id="for-organizations" className="service-panel scroll-mt-24 p-6 md:p-8">
                <h2 className="service-heading text-[28px]">{t.howItWorks.orgHeading}</h2>
                <p className="mt-3 leading-relaxed text-body">
                  {t.howItWorks.orgPara1}
                </p>
                <p className="mt-3 leading-relaxed text-body">
                  {t.howItWorks.orgPara2}
                </p>
                <p className="mt-3 leading-relaxed text-body">
                  {t.howItWorks.orgPara3}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button asChild>
                    <Link href="/org/signup">{t.howItWorks.becomePartner} <ArrowRight /></Link>
                  </Button>
                  <Button asChild variant="tertiary">
                    <Link href="/for-organizations">{t.howItWorks.learnMore}</Link>
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
