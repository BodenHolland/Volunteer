import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
          breadcrumbNav: "Ruta de navegación",
        }
      : {
          helpCenter: "Help Center",
          article: "Article",
          keyArticle: " · ★ Key article",
          previous: "Previous",
          next: "Next",
          breadcrumbNav: "Breadcrumb",
        };
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <article className="mx-auto max-w-[720px] px-4 py-12 md:px-6 md:py-16">
          <nav aria-label={labels.breadcrumbNav} className="mb-6 flex items-center gap-1.5 text-sm">
            <Link href="/help" className="text-meta hover:text-forest hover:underline underline-offset-4">
              {labels.helpCenter}
            </Link>
            <ChevronRight className="size-3.5 shrink-0 text-meta" aria-hidden />
            <span className="truncate text-ink">{title}</span>
          </nav>
          <h1 className="text-[34px] font-semibold leading-[1.15] text-ink md:text-[40px]">
            {title}
          </h1>
          <div className="prose-colift mt-8">{children}</div>

          {(prev || next) && (
            <nav className="mt-12 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
              {prev ? (
                <Link
                  href={prev.href}
                  className="rounded-md border border-line p-4 hover:border-forest"
                >
                  <p className="text-[13px] text-meta">{labels.previous}</p>
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
                  <p className="text-[13px] text-meta">{labels.next}</p>
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
