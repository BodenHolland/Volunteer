"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LOCALES = [
  { code: "en", short: "EN", name: "English" },
  { code: "es", short: "ES", name: "Español" },
] as const;

/**
 * Discreet language selector: a small Globe + current-language button that
 * opens a dropdown to choose between English and Español. Each option is a
 * real link to /api/locale, which sets the `locale` cookie and returns to the
 * current page — so it works without JS and is keyboard/screen-reader friendly.
 *
 * Note: we deliberately use a Globe icon, not lucide's `Languages` icon — the
 * latter is drawn with a CJK character ("文") that reads to users as a random
 * symbol next to a language control.
 */
export function LocaleSwitcher({ locale, className }: { locale: "en" | "es"; className?: string }) {
  // useSearchParams() forces dynamic rendering unless wrapped in Suspense.
  // The /help static pages render the site header, which renders us — so we
  // must wrap to keep them statically generable.
  return (
    <Suspense fallback={<LocaleSwitcherMenu locale={locale} next="" className={className} />}>
      <LocaleSwitcherInner locale={locale} className={className} />
    </Suspense>
  );
}

function LocaleSwitcherInner({ locale, className }: { locale: "en" | "es"; className?: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const qs = params.toString();
  const next = encodeURIComponent(qs ? `${pathname}?${qs}` : pathname);
  return <LocaleSwitcherMenu locale={locale} next={next} className={className} />;
}

function LocaleSwitcherMenu({
  locale,
  next,
  className,
}: {
  locale: "en" | "es";
  next: string;
  className?: string;
}) {
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Language: ${current.name} · Idioma: ${current.name}`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium leading-none opacity-80 transition-colors hover:opacity-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/60 focus-visible:ring-offset-1 data-[state=open]:opacity-100",
          className
        )}
      >
        <Globe className="size-4 opacity-80" aria-hidden />
        <span>{current.short}</span>
        <ChevronDown className="size-3.5 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[160px]">
        {LOCALES.map((l) => {
          const active = l.code === locale;
          return (
            <DropdownMenuItem key={l.code} asChild>
              <a
                href={`/api/locale?to=${l.code}&next=${next}`}
                aria-current={active ? "true" : undefined}
                className="justify-between"
              >
                <span>{l.name}</span>
                {active && <Check className="size-[18px] text-forest" aria-hidden />}
              </a>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
