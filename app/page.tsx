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
  type LucideIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { getDict } from "@/lib/i18n";
import { getCurrentUser, viewerInCalifornia } from "@/lib/session";
import { listActiveTasks } from "@/lib/queries";

export const metadata = { title: "Tended — Online volunteering that counts toward SNAP (EBT)" };

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const { t } = await getDict();
  const L = t.landing;
  const isCA = await viewerInCalifornia();
  const viewer = await getCurrentUser();
  const featuredTasks = (await listActiveTasks()).slice(0, 4);
  const featuredCards: ListingCardData[] = featuredTasks.map((t, i) => ({
    id: t.id,
    href: `/opportunities/${t.id}`,
    title: t.title,
    orgName: t.org.name,
    orgSlug: t.org.slug,
    category: t.category,
    location: t.location_kind,
    createdAt: t.created_at,
    featured: i === 0,
  }));

  const trust: { icon: LucideIcon; label: string }[] = [
    { icon: HandHeart, label: L.trust.free },
    { icon: Clock, label: L.trust.realHours },
    { icon: Smartphone, label: L.trust.phone },
    { icon: FileCheck, label: isCA ? L.trust.snapCA : L.trust.snap },
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
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-24">
            <div className="mx-auto max-w-[680px] text-center">
              <h1 className="text-[38px] font-semibold leading-[1.08] text-ink md:text-[52px]">{t.hero.title}</h1>
              <p className="mt-5 text-lg leading-relaxed text-body">{t.hero.subhead}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg"><Link href="/opportunities">{t.hero.cta} <ArrowRight /></Link></Button>
                <Button asChild size="lg" variant="secondary"><Link href="/how-it-works">{L.secondaryCta}</Link></Button>
              </div>
              <p className="mt-6 text-[15px]">
                <Link href="/how-it-works" className="font-medium text-forest hover:underline">{t.hero.calfresh}</Link>
              </p>
            </div>
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

        {/* Featured opportunities */}
        {featuredCards.length > 0 && (
          <section className="bg-white">
            <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
              <div className="mx-auto max-w-[640px] text-center">
                <h2 className="text-[30px] font-semibold leading-tight text-ink md:text-[34px]">Open volunteer opportunities</h2>
                <p className="mt-2 text-body">Real civic work from sponsoring nonprofits. Browse freely — sign up when you find one you want to commit to.</p>
              </div>
              <div className="mt-8 border-t border-line">
                {featuredCards.map((c) => (
                  <ListingCard key={c.id} task={c} showBookmark={!!viewer} />
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <Button asChild variant="secondary"><Link href="/opportunities">See all opportunities <ArrowRight /></Link></Button>
              </div>
            </div>
          </section>
        )}

        {/* What you'll do */}
        <section className="border-y border-line bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
            <h2 className="mx-auto max-w-[640px] text-center text-[30px] font-semibold leading-tight text-ink md:text-[34px]">{L.work.title}</h2>
            <p className="mx-auto mt-4 max-w-[640px] text-center text-body">{L.work.body}</p>
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
              <h2 className="max-w-[680px] text-[26px] font-semibold leading-tight text-ink md:text-[30px]">{L.snap.title}</h2>
              <p className="mt-4 max-w-[680px] text-body">{isCA ? L.snap.bodyCA : L.snap.body}</p>
              <p className="mt-6">
                <Link href="/how-it-works" className="font-medium text-forest hover:underline">{L.snap.link}</Link>
              </p>
            </div>
          </div>
        </section>

        {/* Organization CTA */}
        <section className="border-t border-line bg-section">
          <div className="mx-auto max-w-[640px] px-4 py-14 text-center md:px-6 md:py-16">
            <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-lg bg-white text-forest shadow-sm">
              <Building2 className="size-5" strokeWidth={1.75} aria-hidden />
            </div>
            <h2 className="text-[22px] font-semibold text-ink">{t.orgCta.title}</h2>
            <p className="mt-2 text-body">{t.orgCta.body}</p>
            <div className="mt-6 flex justify-center">
              <Button asChild variant="secondary"><Link href="/for-organizations">{t.orgCta.button} <ArrowRight /></Link></Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
