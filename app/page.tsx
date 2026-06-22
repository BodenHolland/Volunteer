import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Smartphone,
  FileCheck,
  HandHeart,
  Languages,
  MapPin,
  ShoppingBasket,
  Building2,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { getDict, type Dict } from "@/lib/i18n";

export const metadata = { title: "Tended — Online volunteering that counts toward SNAP (EBT)" };

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const { t } = await getDict();
  const L = t.landing;

  const trust: { icon: LucideIcon; label: string }[] = [
    { icon: HandHeart, label: L.trust.free },
    { icon: Clock, label: L.trust.realHours },
    { icon: Smartphone, label: L.trust.phone },
    { icon: FileCheck, label: L.trust.snap },
  ];

  const steps = [
    { title: L.steps.s1Title, body: L.steps.s1Body },
    { title: L.steps.s2Title, body: L.steps.s2Body },
    { title: L.steps.s3Title, body: L.steps.s3Body },
  ];

  const work: { icon: LucideIcon; title: string; hint: string }[] = [
    { icon: Languages, title: L.work.a, hint: L.work.aHint },
    { icon: MapPin, title: L.work.b, hint: L.work.bHint },
    { icon: ShoppingBasket, title: L.work.c, hint: L.work.cHint },
    { icon: Building2, title: L.work.d, hint: L.work.dHint },
  ];

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="border-b border-line bg-section">
          <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
            <div className="max-w-[560px]">
              <p className="overline mb-4">{t.hero.overline}</p>
              <h1 className="text-[38px] font-semibold leading-[1.08] text-ink md:text-[52px]">{t.hero.title}</h1>
              <p className="mt-5 text-lg leading-relaxed text-body">{t.hero.subhead}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg"><Link href="/app/tasks">{t.hero.cta} <ArrowRight /></Link></Button>
                <Button asChild size="lg" variant="secondary"><Link href="/how-it-works">{L.secondaryCta}</Link></Button>
              </div>
              <p className="mt-6 text-[15px]">
                <Link href="/how-it-works#calfresh" className="font-medium text-forest hover:underline">{t.hero.calfresh}</Link>
              </p>
            </div>
            <HeroPreview L={L} />
          </div>
        </section>

        {/* Trust bar */}
        <section className="border-b border-line bg-white">
          <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-6 gap-y-4 px-4 py-6 md:grid-cols-4 md:px-6">
            {trust.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-sm font-medium text-ink">
                <Icon className="size-[18px] shrink-0 text-forest" strokeWidth={1.75} aria-hidden />
                {label}
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
            <p className="overline mb-3">{L.steps.overline}</p>
            <h2 className="max-w-[640px] text-[30px] font-semibold leading-tight text-ink md:text-[34px]">{L.steps.title}</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((s, i) => (
                <div key={s.title} className="rounded-lg border border-line bg-white p-6 shadow-sm">
                  <div className="flex size-9 items-center justify-center rounded-full bg-forest-subtle text-sm font-semibold text-forest">{i + 1}</div>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-body">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What you'll do */}
        <section className="border-y border-line bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
            <p className="overline mb-3">{L.work.overline}</p>
            <h2 className="max-w-[640px] text-[30px] font-semibold leading-tight text-ink md:text-[34px]">{L.work.title}</h2>
            <p className="mt-4 max-w-[640px] text-body">{L.work.body}</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {work.map(({ icon: Icon, title, hint }) => (
                <div key={title} className="rounded-lg border border-line bg-white p-5">
                  <Icon className="size-6 text-terracotta" strokeWidth={1.75} aria-hidden />
                  <p className="mt-3 font-semibold text-ink">{title}</p>
                  <p className="mt-1 text-sm text-body">{hint}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SNAP callout */}
        <section className="bg-white">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
            <div className="rounded-lg border border-line bg-terracotta-subtle p-8 md:p-10">
              <p className="overline mb-3">{L.snap.overline}</p>
              <h2 className="max-w-[680px] text-[26px] font-semibold leading-tight text-ink md:text-[30px]">{L.snap.title}</h2>
              <p className="mt-4 max-w-[680px] text-body">{L.snap.body}</p>
              <p className="mt-6">
                <Link href="/how-it-works#calfresh" className="font-medium text-forest hover:underline">{L.snap.link}</Link>
              </p>
            </div>
          </div>
        </section>

        {/* Organization CTA */}
        <section className="border-t border-line bg-section">
          <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 px-4 py-12 md:flex-row md:items-center md:px-6">
            <div className="flex items-start gap-4">
              <div className="hidden size-11 shrink-0 items-center justify-center rounded-lg bg-white text-forest shadow-sm sm:flex">
                <Building2 className="size-5" strokeWidth={1.75} aria-hidden />
              </div>
              <div>
                <h2 className="text-[22px] font-semibold text-ink">{t.orgCta.title}</h2>
                <p className="mt-1 text-body">{t.orgCta.body}</p>
              </div>
            </div>
            <Button asChild variant="secondary"><Link href="/for-organizations">{t.orgCta.button} <ArrowRight /></Link></Button>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-forest">
          <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-6 px-4 py-14 md:flex-row md:items-center md:justify-between md:px-6">
            <div>
              <h2 className="text-[28px] font-semibold leading-tight text-white md:text-[32px]">{L.finalCta.title}</h2>
              <p className="mt-2 text-white/80">{L.finalCta.body}</p>
            </div>
            <Button asChild size="lg" variant="secondary" className="border-white bg-white text-forest hover:bg-white/90">
              <Link href="/app/tasks">{L.finalCta.button} <ArrowRight /></Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function HeroPreview({ L }: { L: Dict["landing"] }) {
  return (
    <div className="hidden md:block">
      <div className="mx-auto w-full max-w-[380px]">
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-forest-subtle px-2 py-0.5 text-xs font-semibold text-forest">{L.preview.badge}</span>
            <span className="text-xs text-meta">{L.preview.remote}</span>
          </div>
          <p className="mt-3 font-semibold text-ink">{L.work.c}</p>
          <p className="mt-1 text-sm text-body">{L.preview.org}</p>
          <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-meta">
            <ShoppingBasket className="size-4 text-terracotta" aria-hidden /> {L.work.cHint}
          </div>
        </div>
        <div className="mt-3 ml-8 flex items-center gap-3 rounded-lg border border-line bg-white p-4 shadow-sm">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-forest-subtle text-forest">
            <CheckCircle2 className="size-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">{L.preview.certified}</p>
            <p className="text-xs text-meta">{L.preview.certifiedSub}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
