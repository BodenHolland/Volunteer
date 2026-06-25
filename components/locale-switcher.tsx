"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Languages, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { LOCALE_META } from "@/lib/i18n/registry";

// Priority locales for California SNAP recipients, in display order.
// Only shown when they appear in LOCALE_META (i.e. have been translated).
const CA_TOP_CODES = [
  "en", "es", "zh", "vi", "tl", "ko",
  "hy", "ru", "ar", "fa", "pa", "hi",
  "pt", "km", "bn", "ur", "ja", "th",
];

export function LocaleSwitcher({ locale, className }: { locale: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const next = encodeURIComponent(pathname);

  const current = LOCALE_META[locale] ?? LOCALE_META.en;
  const allEntries = Object.entries(LOCALE_META);

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // Focus the search input when dialog opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allEntries;
    return allEntries.filter(([code, meta]) =>
      meta.name.toLowerCase().includes(q) ||
      meta.englishName.toLowerCase().includes(q) ||
      code.toLowerCase().startsWith(q),
    );
  }, [query, allEntries]);

  const topEntries = filtered.filter(([code]) => CA_TOP_CODES.includes(code));
  const moreEntries = filtered.filter(([code]) => !CA_TOP_CODES.includes(code));
  const noResults = filtered.length === 0;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* Trigger */}
      <Dialog.Trigger asChild>
        <button
          aria-label={`Language: ${current.englishName}. Select to change.`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium leading-none",
            "opacity-80 transition-opacity hover:opacity-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/60 focus-visible:ring-offset-1",
            className,
          )}
        >
          <Languages className="size-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">{current.englishName}</span>
          <span className="sm:hidden">{current.short}</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Panel */}
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "fixed z-50 flex flex-col bg-white shadow-2xl",
            // Mobile: full screen
            "inset-0",
            // Desktop: centered card
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
            "sm:w-full sm:max-w-2xl sm:max-h-[82vh] sm:rounded-xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4 bg-navy px-5 py-4 shrink-0 sm:rounded-t-xl">
            <Dialog.Title className="text-base font-semibold text-white">
              Select language
            </Dialog.Title>
            <Dialog.Close className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
              <X className="size-4" aria-hidden />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-line shrink-0">
            <input
              ref={inputRef}
              type="search"
              placeholder="Filter languages"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(
                "w-full rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink",
                "placeholder:text-muted",
                "focus:outline-none focus:ring-2 focus:ring-forest/50 focus:border-forest",
              )}
            />
          </div>

          {/* Language list */}
          <div className="overflow-y-auto flex-1 px-5 py-4">
            {noResults && (
              <p className="py-12 text-center text-sm text-muted">
                No languages match &ldquo;{query}&rdquo;
              </p>
            )}

            {topEntries.length > 0 && (
              <section className="mb-6">
                <h3 className="mb-2 text-[13px] font-semibold text-muted">
                  Top languages
                </h3>
                <LanguageGrid entries={topEntries} locale={locale} next={next} onSelect={() => setOpen(false)} />
              </section>
            )}

            {moreEntries.length > 0 && (
              <section>
                <h3 className="mb-2 text-[13px] font-semibold text-muted">
                  {topEntries.length > 0 ? "More languages" : "All languages"}
                </h3>
                <LanguageGrid entries={moreEntries} locale={locale} next={next} onSelect={() => setOpen(false)} />
              </section>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function LanguageGrid({
  entries,
  locale,
  next,
  onSelect,
}: {
  entries: [string, (typeof LOCALE_META)[string]][];
  locale: string;
  next: string;
  onSelect: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-px sm:grid-cols-2">
      {entries.map(([code, meta]) => (
        <LanguageOption
          key={code}
          code={code}
          meta={meta}
          active={code === locale}
          next={next}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function LanguageOption({
  code,
  meta,
  active,
  next,
  onSelect,
}: {
  code: string;
  meta: (typeof LOCALE_META)[string];
  active: boolean;
  next: string;
  onSelect: () => void;
}) {
  const showSubtitle = meta.name !== meta.englishName;
  return (
    <a
      href={`/api/locale?to=${code}&next=${next}`}
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      dir={meta.rtl ? "rtl" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
        "hover:bg-section focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-forest/50",
        active && "bg-teal-subtle",
      )}
    >
      {/* Radio indicator */}
      <span
        aria-hidden
        className={cn(
          "mt-px flex-none size-4 rounded-full border-2 flex items-center justify-center transition-colors",
          active
            ? "border-forest bg-forest"
            : "border-line group-hover:border-forest/50",
        )}
      >
        {active && <span className="size-1.5 rounded-full bg-white" />}
      </span>

      {/* Names */}
      <span className="flex-1 min-w-0">
        <span className={cn("block text-sm font-medium leading-snug", active ? "text-forest" : "text-ink")}>
          {meta.name}
        </span>
        {showSubtitle && (
          <span className="block text-xs text-muted leading-tight">{meta.englishName}</span>
        )}
      </span>
    </a>
  );
}
