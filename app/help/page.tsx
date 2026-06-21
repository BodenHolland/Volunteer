import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ARTICLES, SECTIONS } from "./_components/articles";

export const metadata = { title: "Help Center — Tended" };

export default function HelpIndex() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
            <div className="max-w-[720px]">
              <p className="overline mb-4">Help Center</p>
              <h1 className="text-[40px] font-semibold leading-[1.1] text-ink md:text-[48px]">
                How Tended works, and the authority behind it.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-body">
                Plain-language methodology articles for volunteers, caseworkers, and
                anyone reviewing a CF 888 we signed. Citations to the primary law are
                in every article. Items marked ★ are the load-bearing ones.
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
                      {section.name}
                    </h2>
                    <ul className="mt-4 grid gap-3 md:grid-cols-2">
                      {items.map((a) => (
                        <li key={a.slug}>
                          <Link
                            href={`/help/${a.slug}`}
                            className="block rounded-md border border-gray-200 p-4 transition hover:border-forest"
                          >
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                              {a.starred ? "★ Key article" : `Article ${a.number}`}
                            </p>
                            <p className="mt-1 font-medium text-ink">{a.title}</p>
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
