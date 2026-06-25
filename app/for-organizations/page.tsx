import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Eye,
  Stamp,
  Building2,
  Landmark,
  GraduationCap,
  Apple,
  CheckCircle2,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { getDict } from "@/lib/i18n";

export const metadata = { title: "For organizations | colift" };

export const dynamic = "force-dynamic";

export default async function ForOrganizationsPage() {
  const { t } = await getDict();

  const steps = [
    { icon: ClipboardList, title: t.forOrgs.step0Title, body: t.forOrgs.step0Body },
    { icon: Eye,           title: t.forOrgs.step1Title, body: t.forOrgs.step1Body },
    { icon: Stamp,         title: t.forOrgs.step2Title, body: t.forOrgs.step2Body },
  ];

  const eligible = [
    { icon: Building2,       label: t.forOrgs.eligible0 },
    { icon: Landmark,        label: t.forOrgs.eligible1 },
    { icon: GraduationCap,   label: t.forOrgs.eligible2 },
    { icon: Apple,           label: t.forOrgs.eligible3 },
  ];

  const whatYouGet = [
    t.forOrgs.whatYouGet0,
    t.forOrgs.whatYouGet1,
    t.forOrgs.whatYouGet2,
    t.forOrgs.whatYouGet3,
  ];

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* ─── HERO (white, default canvas) ─────────────────────────── */}
        <section className="border-b border-civic-line bg-white">
          <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-24">
            <div className="max-w-[760px]">
              <h1 className="text-[40px] font-semibold leading-[1.06] tracking-tight text-ink md:text-[56px]">
                {t.forOrgs.title}
              </h1>
              <p className="mt-6 max-w-[640px] text-[18px] leading-relaxed text-body">
                {t.forOrgs.intro}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/org/signup">{t.forOrgs.becomePartner} <ArrowRight /></Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/how-it-works#for-organizations">{t.forOrgs.howCert}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── STEPS (white, operational / methodical) ─────────────── */}
        <section className="border-b border-civic-line bg-white">
          <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-24">
            <div className="max-w-[720px]">
              <h2 className="text-[28px] font-semibold leading-tight tracking-tight text-ink md:text-[34px]">
                {t.forOrgs.threeThings}
              </h2>
              <p className="mt-3 leading-relaxed text-body">
                {t.forOrgs.threeThingsSub}
              </p>
            </div>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.title} className="rounded-lg border border-civic-line bg-white p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-md bg-civic-blue-soft text-civic-blue text-[13px] font-semibold">
                      {i + 1}
                    </span>
                    <span className="flex size-9 items-center justify-center rounded-md bg-civic-blue text-white">
                      <s.icon className="size-5" strokeWidth={1.75} />
                    </span>
                  </div>
                  <h3 className="mt-5 text-[18px] font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-body">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ─── ELIGIBILITY (Warm Sand, partner / institutional mode) ── */}
        <section className="mode-partner border-b border-civic-line">
          <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-24">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <div className="max-w-[560px]">
                <h2 className="text-[28px] font-semibold leading-tight tracking-tight text-ink md:text-[34px]">
                  {t.forOrgs.whoCanTitle}
                </h2>
                <p className="mt-3 leading-relaxed text-body">
                  {t.forOrgs.whoCanBody}
                </p>
                <ul className="mt-6 space-y-2.5">
                  {eligible.map((e) => (
                    <li key={e.label} className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-md border border-civic-line bg-white text-ink [&_svg]:size-[18px]">
                        <e.icon strokeWidth={1.5} />
                      </span>
                      <span className="font-medium text-ink">{e.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-civic-line bg-white p-6 md:p-8">
                <h3 className="text-[18px] font-semibold text-ink">{t.forOrgs.whatYouGetTitle}</h3>
                <ul className="mt-5 space-y-3">
                  {whatYouGet.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-body">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-field-green" strokeWidth={2} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA (Ink, strong institutional close) ───────────────── */}
        <section className="bg-ink text-paper">
          <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-20">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h2 className="text-[24px] font-semibold leading-tight tracking-tight md:text-[28px]">
                  {t.forOrgs.ctaTitle}
                </h2>
                <p className="mt-2 text-paper/75">{t.forOrgs.ctaBody}</p>
              </div>
              <Button asChild size="lg" variant="primary">
                <Link href="/org/signup">{t.forOrgs.becomePartner} <ArrowRight /></Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
