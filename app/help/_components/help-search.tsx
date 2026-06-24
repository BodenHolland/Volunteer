"use client";

import Link from "next/link";
import { ArrowRight, FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";

type SearchArticle = {
  slug: string;
  title: string;
  section: string;
};

export function HelpSearch({
  articles,
  placeholder,
  resultsLabel,
  noResults,
}: {
  articles: SearchArticle[];
  placeholder: string;
  resultsLabel: string;
  noResults: string;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return [];
    return articles.filter((article) =>
      `${article.title} ${article.section}`.toLocaleLowerCase().includes(term),
    );
  }, [articles, query]);

  return (
    <div className="relative mx-auto mt-7 max-w-2xl text-left">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-meta" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-14 w-full rounded-lg border border-line bg-white pl-12 pr-4 text-base text-ink shadow-sm placeholder:text-meta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
          placeholder={placeholder}
          aria-label={placeholder}
        />
      </div>

      {query.trim() && (
        <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border border-line bg-white text-left shadow-lg">
          <p className="border-b border-line px-4 py-3 text-xs font-medium uppercase tracking-wide text-meta">
            {resultsLabel}
          </p>
          {results.length > 0 ? (
            <ul className="divide-y divide-line">
              {results.map((article) => (
                <li key={article.slug}>
                  <Link href={`/help/${article.slug}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-section">
                    <FileText className="size-4 shrink-0 text-forest" aria-hidden />
                    <span className="min-w-0 flex-1 font-medium text-ink">{article.title}</span>
                    <ArrowRight className="size-4 shrink-0 text-meta" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-5 text-sm text-body">{noResults}</p>
          )}
        </div>
      )}
    </div>
  );
}
