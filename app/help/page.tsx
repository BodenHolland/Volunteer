import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ARTICLES, SECTIONS, articleTitle, sectionName } from "./_components/articles";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "Help Center — Tended" };

export default async function HelpIndex() {
  const locale = await getLocale();
  const t =
    locale === "es"
      ? {
          overline: "Centro de ayuda",
          heroTitle: "Cómo funciona Tended, y la autoridad que lo respalda.",
          intro:
            "Artículos de metodología en lenguaje claro para voluntarios, trabajadores sociales y cualquier persona que revise un CF 888 que firmamos. Las citas a la ley principal están en cada artículo. Los marcados con ★ son los fundamentales.",
          keyArticle: "★ Artículo clave",
          article: "Artículo",
        }
      : {
          overline: "Help Center",
          heroTitle: "How Tended works, and the authority behind it.",
          intro:
            "Plain-language methodology articles for volunteers, caseworkers, and anyone reviewing a CF 888 we signed. Citations to the primary law are in every article. Items marked ★ are the load-bearing ones.",
          keyArticle: "★ Key article",
          article: "Article",
        };

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
            <div className="mx-auto max-w-[720px] text-center">
              <h1 className="text-[40px] font-semibold leading-[1.1] text-ink md:text-[48px]">
                {t.heroTitle}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-body">
                {t.intro}
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
            <div className="grid gap-10">
              {SECTIONS.map((section) => {
                const items = ARTICLES.filter(
                  (a) => a.number >= section.range[0] && a.number <= section.range[1],
                );
                return (
                  <div key={section.name}>
                    <h2 className="text-[22px] font-semibold text-ink">
                      {sectionName(section, locale)}
                    </h2>
                    <ul className="mt-4 grid gap-3 md:grid-cols-2">
                      {items.map((a) => (
                        <li key={a.slug}>
                          <Link
                            href={`/help/${a.slug}`}
                            className="block rounded-md border border-line p-4 transition hover:border-forest"
                          >
                            <p className="text-xs uppercase tracking-wide text-meta">
                              {a.starred ? t.keyArticle : `${t.article} ${a.number}`}
                            </p>
                            <p className="mt-1 font-medium text-ink">{articleTitle(a, locale)}</p>
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
