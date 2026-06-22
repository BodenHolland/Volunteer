import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getLocale } from "@/lib/i18n";

export async function ArticleShell({
  number,
  title,
  starred,
  prev,
  next,
  children,
}: {
  number: number;
  title: string;
  starred?: boolean;
  prev?: { href: string; title: string };
  next?: { href: string; title: string };
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const labels =
    locale === "es"
      ? {
          helpCenter: "Centro de ayuda",
          article: "Artículo",
          keyArticle: " · ★ Artículo clave",
          previous: "Anterior",
          next: "Siguiente",
        }
      : {
          helpCenter: "Help Center",
          article: "Article",
          keyArticle: " · ★ Key article",
          previous: "Previous",
          next: "Next",
        };
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <article className="mx-auto max-w-[720px] px-4 py-12 md:px-6 md:py-16">
          <p className="mb-3 text-sm text-body">
            <Link href="/help" className="hover:underline">
              {labels.helpCenter}
            </Link>{" "}
            · {labels.article} {number}
            {starred ? labels.keyArticle : ""}
          </p>
          <h1 className="text-[34px] font-semibold leading-[1.15] text-ink md:text-[40px]">
            {title}
          </h1>
          <div className="prose-tended mt-8">{children}</div>

          {(prev || next) && (
            <nav className="mt-12 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
              {prev ? (
                <Link
                  href={prev.href}
                  className="rounded-md border border-line p-4 hover:border-forest"
                >
                  <p className="text-xs uppercase tracking-wide text-meta">
                    {labels.previous}
                  </p>
                  <p className="mt-1 font-medium text-ink">{prev.title}</p>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  href={next.href}
                  className="rounded-md border border-line p-4 text-right hover:border-forest"
                >
                  <p className="text-xs uppercase tracking-wide text-meta">
                    {labels.next}
                  </p>
                  <p className="mt-1 font-medium text-ink">{next.title}</p>
                </Link>
              ) : (
                <div />
              )}
            </nav>
          )}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
