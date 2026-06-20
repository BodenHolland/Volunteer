import Link from "next/link";
import { ArrowRight, Trees, FileCheck2, Users, Languages, MapPinned, NotebookPen } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PilotBanner } from "@/components/pilot-banner";
import { Button } from "@/components/ui/button";
import { getDict } from "@/lib/i18n";

export const metadata = { title: "Tended — Real civic work for your neighborhood" };

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const { locale, t } = await getDict();
  const features = [
    { icon: Trees, title: t.features.f1Title, body: t.features.f1Body },
    { icon: FileCheck2, title: t.features.f2Title, body: t.features.f2Body },
    { icon: Users, title: t.features.f3Title, body: t.features.f3Body },
  ];
  const samples = [
    { icon: Trees, t: t.sampleTasks.trees },
    { icon: Languages, t: t.sampleTasks.translate },
    { icon: MapPinned, t: t.sampleTasks.hazards },
    { icon: NotebookPen, t: t.sampleTasks.document },
  ];

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <PilotBanner text={t.pilotBanner} />
      <SiteHeader locale={locale} t={t.nav} />
      <main id="main" className="flex-1">
        <section className="bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-20 md:px-6 md:py-28">
            <div className="max-w-[720px]">
              <p className="overline mb-4">{t.hero.overline}</p>
              <h1 className="text-[44px] font-semibold leading-[1.1] text-ink md:text-[52px]">{t.hero.title}</h1>
              <p className="mt-5 text-lg leading-relaxed text-body">{t.hero.subhead}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg"><Link href="/app/tasks">{t.hero.cta} <ArrowRight /></Link></Button>
                <Button asChild size="lg" variant="secondary"><Link href="/login">{t.nav.signIn}</Link></Button>
              </div>
              <p className="mt-6 text-[15px]">
                <Link href="/how-it-works#calfresh" className="font-medium text-forest hover:underline">{t.hero.calfresh}</Link>
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-white">
          <div className="mx-auto flex max-w-[1200px] flex-wrap gap-3 px-4 py-6 md:px-6">
            {samples.map((s) => (
              <span key={s.t} className="inline-flex items-center gap-2 rounded-full border border-line bg-section px-3.5 py-2 text-sm font-medium text-ink [&_svg]:size-4 [&_svg]:text-forest">
                <s.icon /> {s.t}
              </span>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-24">
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((f) => (
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

        <section className="bg-section">
          <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 px-4 py-12 md:flex-row md:items-center md:px-6">
            <div>
              <h2 className="text-[22px] font-semibold text-ink">{t.orgCta.title}</h2>
              <p className="mt-1 text-body">{t.orgCta.body}</p>
            </div>
            <Button asChild variant="secondary"><Link href="/for-organizations">{t.orgCta.button} <ArrowRight /></Link></Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
