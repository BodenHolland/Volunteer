import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { getDict } from "@/lib/i18n";

export const metadata = { title: "Tended — Volunteer hours that count toward CalFresh" };

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const { locale, t } = await getDict();

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
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
