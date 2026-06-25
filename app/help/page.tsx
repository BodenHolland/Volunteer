import Link from "next/link";
import { ArrowRight, Info, BadgeCheck, ShieldCheck, Users, Compass, User, LifeBuoy } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HelpSearch } from "./_components/help-search";
import { ARTICLES, SECTIONS, articleTitle, sectionName } from "./_components/articles";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "Help Center — colift" };

const SECTION_ICONS: Record<string, typeof Info> = {
  about: Info,
  "snap-hours": BadgeCheck,
  verification: ShieldCheck,
  caseworkers: Users,
  "using-colift": Compass,
  account: User,
  "getting-help": LifeBuoy,
};

export default async function HelpIndex() {
  const { locale, t } = await getDict();

  const searchArticles = ARTICLES.map((article) => {
    const section = SECTIONS.find((item) => article.number >= item.range[0] && article.number <= item.range[1]);
    return { slug: article.slug, title: articleTitle(article, locale), section: section ? sectionName(section, locale) : "" };
  });
  const keyArticles = ARTICLES.filter((article) => article.starred);

  return (
    <>
      <a href="#main" className="skip-link">{t.helpIndex.skipToContent}</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="border-b border-line bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
            <div className="mx-auto max-w-[760px] text-center">
              <h1 className="mt-3 text-[40px] font-semibold leading-[1.1] text-ink md:text-[48px]">{t.helpIndex.heroTitle}</h1>
              <p className="mt-4 text-lg leading-relaxed text-body">{t.helpIndex.intro}</p>
              <HelpSearch articles={searchArticles} placeholder={t.helpIndex.searchPlaceholder} resultsLabel={t.helpIndex.resultsLabel} noResults={t.helpIndex.noResults} />
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-6 md:py-16">
            <div className="flex items-end justify-between gap-6">
              <div>
                <h2 className="text-[28px] font-semibold leading-tight text-ink">{t.helpIndex.startHere}</h2>
                <p className="mt-2 text-body">{t.helpIndex.startHereBody}</p>
              </div>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {keyArticles.map((article) => (
                <Link key={article.slug} href={`/help/${article.slug}`} className="group rounded-lg border border-line bg-white p-5 transition hover:border-forest hover:shadow-sm">
                  <h3 className="text-lg font-semibold leading-snug text-ink group-hover:text-forest">{articleTitle(article, locale)}</h3>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-forest">{t.helpIndex.readArticle} <ArrowRight className="size-4" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-6 md:py-16">
            <h2 className="text-[28px] font-semibold leading-tight text-ink">{t.helpIndex.browseTopics}</h2>
            <div className="mt-7 grid gap-5 md:grid-cols-2">
              {SECTIONS.map((section) => {
                const items = ARTICLES.filter((article) => article.number >= section.range[0] && article.number <= section.range[1]);
                const Icon = SECTION_ICONS[section.slug] ?? Info;
                return (
                  <div key={section.slug} id={section.slug} className="scroll-mt-24 overflow-hidden rounded-lg border border-line bg-white">
                    <div className="flex items-center gap-3 border-b border-line bg-section px-5 py-3.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-forest-subtle text-forest">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <h3 className="font-semibold text-ink">{sectionName(section, locale)}</h3>
                    </div>
                    <ul className="divide-y divide-line">
                      {items.map((article) => (
                        <li key={article.slug}>
                          <Link href={`/help/${article.slug}`} className="group flex items-center gap-3 px-5 py-3.5 hover:bg-section">
                            <span className="min-w-0 flex-1 text-sm font-medium text-ink group-hover:text-forest">
                              {articleTitle(article, locale)}
                            </span>
                            <ArrowRight className="size-4 shrink-0 text-meta" aria-hidden />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
