"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

/** EN | ES toggle. Sets the locale cookie via /api/locale and returns to the current page. */
export function LocaleSwitcher({ locale, className }: { locale: "en" | "es"; className?: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const qs = params.toString();
  const next = encodeURIComponent(qs ? `${pathname}?${qs}` : pathname);

  return (
    <div className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <Languages className="size-4 text-meta" aria-hidden />
      <a
        href={`/api/locale?to=en&next=${next}`}
        className={cn("rounded px-1.5 py-0.5 font-medium", locale === "en" ? "bg-forest-subtle text-forest" : "text-meta hover:text-ink")}
        aria-current={locale === "en" ? "true" : undefined}
      >
        EN
      </a>
      <span className="text-line">·</span>
      <a
        href={`/api/locale?to=es&next=${next}`}
        className={cn("rounded px-1.5 py-0.5 font-medium", locale === "es" ? "bg-forest-subtle text-forest" : "text-meta hover:text-ink")}
        aria-current={locale === "es" ? "true" : undefined}
      >
        ES
      </a>
    </div>
  );
}
