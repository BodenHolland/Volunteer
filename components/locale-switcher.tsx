"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "en", short: "EN", name: "English" },
  { code: "es", short: "ES", name: "Español" },
] as const;

/**
 * EN | ES language toggle. Each option is a real link to /api/locale, which
 * sets the `locale` cookie and returns to the current page — so it works
 * without JS and is keyboard/screen-reader accessible.
 *
 * Note: we deliberately use a Globe icon, not lucide's `Languages` icon — the
 * latter is drawn with a CJK character ("文"), which read to users as random
 * "Asian symbols" sitting next to a control that (being decorative) didn't do
 * anything when clicked. Both segments below are sized as obvious tap targets.
 */
export function LocaleSwitcher({ locale, className }: { locale: "en" | "es"; className?: string }) {
  // useSearchParams() forces dynamic rendering unless wrapped in Suspense.
  // The /help static pages render the site header, which renders us — so we
  // must wrap to keep them statically generable.
  return (
    <Suspense fallback={<LocaleSwitcherLinks locale={locale} next="" className={className} />}>
      <LocaleSwitcherInner locale={locale} className={className} />
    </Suspense>
  );
}

function LocaleSwitcherInner({ locale, className }: { locale: "en" | "es"; className?: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const qs = params.toString();
  const next = encodeURIComponent(qs ? `${pathname}?${qs}` : pathname);
  return <LocaleSwitcherLinks locale={locale} next={next} className={className} />;
}

function LocaleSwitcherLinks({
  locale,
  next,
  className,
}: {
  locale: "en" | "es";
  next: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Select language · Seleccionar idioma"
      className={cn("inline-flex items-center gap-0.5 rounded-full text-sm", className)}
    >
      <Globe className="mr-0.5 size-4 opacity-70" aria-hidden />
      {LOCALES.map((l) => {
        const active = l.code === locale;
        return (
          <a
            key={l.code}
            href={`/api/locale?to=${l.code}&next=${next}`}
            aria-current={active ? "true" : undefined}
            aria-label={l.name}
            title={l.name}
            className={cn(
              "rounded-full px-2.5 py-1 font-semibold leading-none transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/60 focus-visible:ring-offset-1",
              active
                ? "bg-forest-subtle text-forest"
                : "opacity-80 hover:bg-forest-subtle hover:text-forest hover:opacity-100"
            )}
          >
            {l.short}
          </a>
        );
      })}
    </div>
  );
}
