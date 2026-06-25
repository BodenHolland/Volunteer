"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDown, MapPin, Search, X } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LOCATIONS = [
  { value: "in_person", label: "In person" },
  { value: "online",    label: "Remote" },
  { value: "hybrid",    label: "Hybrid" },
];

/**
 * Prominent search row for /opportunities, each segment is its own
 * independent pill. Hover/focus state is local to the segment that owns it;
 * the row itself has no shared border or shell.
 */
export function OpportunitiesSearch({ locationCounts = {} }: { locationCounts?: Record<string, number> }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const inputId = useId();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(params.get("q") ?? "");
  }, [params]);

  const pushParams = useCallback(
    (mutate: (sp: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [params, pathname, router],
  );

  const onQueryChange = (v: string) => {
    setQuery(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      pushParams((sp) => {
        if (v.trim()) sp.set("q", v);
        else sp.delete("q");
      });
    }, 250);
  };

  const clearQuery = () => {
    setQuery("");
    if (debounce.current) clearTimeout(debounce.current);
    pushParams((sp) => sp.delete("q"));
    inputRef.current?.focus();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounce.current) clearTimeout(debounce.current);
    pushParams((sp) => {
      if (query.trim()) sp.set("q", query);
      else sp.delete("q");
    });
  };

  const locSel = new Set((params.get("loc") ?? "").split(",").filter(Boolean));
  const toggleLoc = (value: string) =>
    pushParams((sp) => {
      const s = new Set((sp.get("loc") ?? "").split(",").filter(Boolean));
      if (s.has(value)) s.delete(value);
      else s.add(value);
      if (s.size) sp.set("loc", [...s].join(","));
      else sp.delete("loc");
    });
  const clearLoc = () =>
    pushParams((sp) => {
      sp.delete("loc");
    });

  const locLabel =
    locSel.size === 0
      ? "Anywhere"
      : locSel.size === 1
      ? LOCATIONS.find((l) => l.value === [...locSel][0])?.label ?? "Anywhere"
      : `${locSel.size} selected`;

  // Each pill: own border, own focus-within ring. Self-contained.
  const pillBase =
    "h-12 rounded-lg border border-civic-line bg-white transition-shadow duration-150 " +
    "focus-within:border-civic-blue focus-within:shadow-[0_0_0_3px_rgba(40,84,197,0.15)]";

  const triggerInner =
    "flex h-full w-full items-center gap-2 px-4 text-left text-[14px] font-medium text-ink " +
    "rounded-lg transition-colors hover:bg-gray-100 " +
    "focus:outline-none focus-visible:outline-none";

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      aria-label="Search volunteer opportunities"
      className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2"
    >
      {/* Kind selector pill */}
      <Popover>
        <div className={cn(pillBase, "md:w-[180px]")}>
          <PopoverTrigger type="button" className={cn(triggerInner, "justify-between")}>
            <span>Volunteer tasks</span>
            <ChevronDown className="size-4 text-slate" aria-hidden />
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-[260px] p-2">
          <div className="rounded-md bg-gray-100 px-3 py-2 text-[14px] font-medium text-ink">
            ✓ Volunteer tasks
          </div>
          <p className="px-3 py-2 text-[12px] text-slate">
            Jobs and events from partner organizations are coming.
          </p>
        </PopoverContent>
      </Popover>

      {/* Keyword input pill, flexes to take remaining width */}
      <div className={cn(pillBase, "relative flex flex-1 items-center")}>
        <Search className="pointer-events-none absolute left-4 size-5 text-slate-soft" aria-hidden />
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by keyword, skill, or interest"
          aria-label="Keyword search"
          className={cn(
            "h-full w-full rounded-lg bg-transparent pl-11 pr-10 text-[14px] text-ink caret-ink",
            "placeholder:text-slate-soft",
            "outline-none focus:outline-none focus-visible:outline-none",
            "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
          )}
        />
        {query && (
          <button
            type="button"
            onClick={clearQuery}
            aria-label="Clear search"
            className="absolute right-2 grid size-7 place-items-center rounded-full text-slate hover:bg-gray-100 hover:text-ink focus:outline-none focus-visible:outline-none focus-visible:bg-gray-100 focus-visible:text-ink"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Location selector pill */}
      <Popover>
        <div className={cn(pillBase, "md:w-[210px]")}>
          <PopoverTrigger type="button" className={cn(triggerInner, "justify-between")}>
            <span className="inline-flex items-center gap-1.5 truncate">
              <MapPin className="size-4 shrink-0 text-slate" aria-hidden />
              <span className="truncate">{locLabel}</span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-slate" aria-hidden />
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-[240px] p-2">
          <p className="px-3 pb-1 pt-2 text-[12px] text-slate">Location type</p>
          {LOCATIONS.map((l) => (
            <label
              key={l.value}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 hover:bg-gray-100"
            >
              <input
                type="checkbox"
                checked={locSel.has(l.value)}
                onChange={() => toggleLoc(l.value)}
                className="size-4 accent-[var(--color-civic-blue)]"
              />
              <span className="flex-1 text-[14px] text-ink">{l.label}</span>
              <span className="text-[12px] text-slate-soft">{locationCounts[l.value] ?? 0}</span>
            </label>
          ))}
          {locSel.size > 0 && (
            <button
              type="button"
              onClick={clearLoc}
              className="mt-1 w-full rounded-md px-3 py-2 text-left text-[13px] font-medium text-civic-blue hover:bg-gray-100"
            >
              Clear location
            </button>
          )}
        </PopoverContent>
      </Popover>

      {/* Submit, its own independent button, no shared shell */}
      <Button type="submit" size="lg" className="h-12 gap-1.5 md:px-6">
        <Search className="size-4" /> Search
      </Button>
    </form>
  );
}
