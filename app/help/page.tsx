import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HelpSearch } from "./_components/help-search";
import { ARTICLES, SECTIONS, articleTitle, sectionName } from "./_components/articles";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "Help Center — Tended" };

export default async function HelpIndex() {
  const locale = await getLocale();
  const t = locale === "es" ? {
    overline: "Centro de ayuda",
    heroTitle: "¿Cómo podemos ayudarte?",
    intro: "Respuestas claras sobre el voluntariado con Tended, la certificación de horas y las reglas de SNAP.",
    searchPlaceholder: "Busca un tema o pregunta",
    resultsLabel: "Resultados",
    noResults: "No encontramos un artículo con ese término.",
    startHere: "Empieza aquí",
    startHereBody: "Las respuestas más útiles para entender cómo funciona Tended y cómo se certifican tus horas.",
    keyGuide: "Guía clave",
    browseTopics: "Explora por tema",
    allArticles: "Todos los artículos",
    readArticle: "Leer artículo",
  } : {
    overline: "Help Center",
    heroTitle: "How can we help?",
    intro: "Clear answers about volunteering with Tended, work-hour certification, and SNAP rules.",
    searchPlaceholder: "Search for a topic or question",
    resultsLabel: "Search results",
    noResults: "No help articles match that search.",
    startHere: "Start here",
    startHereBody: "The most useful answers for understanding Tended and how your hours are certified.",
    keyGuide: "Key guide",
    browseTopics: "Browse by topic",
    allArticles: "All articles",
    readArticle: "Read article",
  };

  const searchArticles = ARTICLES.map((article) => {
    const section = SECTIONS.find((item) => article.number >= item.range[0] && article.number <= item.range[1]);
    return { slug: article.slug, title: articleTitle(article, locale), section: section ? sectionName(section, locale) : "" };
  });
  const keyArticles = ARTICLES.filter((article) => article.starred);

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="border-b border-line bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
            <div className="mx-auto max-w-[760px] text-center">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-forest">{t.overline}</p>
              <h1 className="mt-3 text-[40px] font-semibold leading-[1.1] text-ink md:text-[48px]">{t.heroTitle}</h1>
              <p className="mx-auto mt-4 max-w-[620px] text-lg leading-relaxed text-body">{t.intro}</p>
              <HelpSearch articles={searchArticles} placeholder={t.searchPlaceholder} resultsLabel={t.resultsLabel} noResults={t.noResults} />
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-6 md:py-16">
            <div className="flex items-end justify-between gap-6">
              <div>
                <h2 className="text-[28px] font-semibold leading-tight text-ink">{t.startHere}</h2>
                <p className="mt-2 max-w-[620px] text-body">{t.startHereBody}</p>
              </div>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {keyArticles.map((article) => (
                <Link key={article.slug} href={`/help/${article.slug}`} className="group rounded-lg border border-line bg-white p-5 transition hover:border-forest hover:shadow-sm">
                  <h3 className="text-lg font-semibold leading-snug text-ink group-hover:text-forest">{articleTitle(article, locale)}</h3>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-forest">{t.readArticle} <ArrowRight className="size-4" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-6 md:py-16">
            <h2 className="text-[28px] font-semibold leading-tight text-ink">{t.browseTopics}</h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SECTIONS.map((section) => {
                const itemCount = ARTICLES.filter((article) => article.number >= section.range[0] && article.number <= section.range[1]).length;
                return (
                  <a key={section.slug} href={`#${section.slug}`} className="group flex items-center gap-3 rounded-lg border border-line bg-white p-4 transition hover:border-forest">
                    <span className="flex size-9 items-center justify-center rounded-md bg-forest-subtle text-forest"><BookOpen className="size-[18px]" aria-hidden /></span>
                    <span className="min-w-0 flex-1 font-medium text-ink group-hover:text-forest">{sectionName(section, locale)}</span>
                    <span className="text-sm text-meta">{itemCount}</span>
                    <ArrowRight className="size-4 text-meta" aria-hidden />
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-6 md:py-16">
            <h2 className="text-[28px] font-semibold leading-tight text-ink">{t.allArticles}</h2>
            <div className="mt-8 grid gap-10">
              {SECTIONS.map((section) => {
                const items = ARTICLES.filter((article) => article.number >= section.range[0] && article.number <= section.range[1]);
                return (
                  <section id={section.slug} key={section.slug} className="scroll-mt-24">
                    <h3 className="text-xl font-semibold text-ink">{sectionName(section, locale)}</h3>
                    <ul className="mt-3 overflow-hidden rounded-lg border border-line bg-white divide-y divide-line">
                      {items.map((article) => (
                        <li key={article.slug}>
                          <Link href={`/help/${article.slug}`} className="group flex items-center gap-4 px-5 py-4 hover:bg-section">
                            <span className="min-w-0 flex-1 font-medium text-ink group-hover:text-forest">{articleTitle(article, locale)}</span>
                            <ArrowRight className="size-4 shrink-0 text-meta" aria-hidden />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
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
