"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { MapPin, Tag, Search, SlidersHorizontal, BadgeCheck } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LOCATIONS = [
  { value: "in_person", label: "In person" },
  { value: "online", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];
const CATEGORIES = [
  { value: "community-service", label: "Community service" },
  { value: "data-collection", label: "Field data" },
  { value: "translation", label: "Translation" },
  { value: "civic-input", label: "Civic input" },
  { value: "neighborhood-writing", label: "Writing" },
  { value: "seminar", label: "Learning" },
];

const LISTING_TYPES = [
  { value: "native", label: "Certification eligible" },
  { value: "external", label: "External opportunity" },
];

export function TaskFilters({
  counts,
  listingTypeCounts = {},
  variant = "toolbar",
  hideSearch = false,
}: {
  counts: { location: Record<string, number>; category: Record<string, number> };
  listingTypeCounts?: Record<string, number>;
  variant?: "toolbar" | "sidebar";
  hideSearch?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const selected = (key: string) => new Set((params.get(key) ?? "").split(",").filter(Boolean));

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      const set = new Set((next.get(key) ?? "").split(",").filter(Boolean));
      if (set.has(value)) set.delete(value);
      else set.add(value);
      if (set.size) next.set(key, [...set].join(","));
      else next.delete(key);
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router]
  );

  const reset = (key: string) => {
    const next = new URLSearchParams(params.toString());
    next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  };

  const setSearch = (q: string) => {
    const next = new URLSearchParams(params.toString());
    if (q) next.set("q", q);
    else next.delete("q");
    router.push(`${pathname}?${next.toString()}`);
  };

  const locSel = selected("loc");
  const catSel = selected("cat");
  const typeSel = selected("type");
  const anyActive = locSel.size > 0 || catSel.size > 0 || typeSel.size > 0 || !!params.get("q");
  const isSidebar = variant === "sidebar";

  const Chip = ({
    icon,
    label,
    count,
    options,
    paramKey,
    sel,
    optCounts,
  }: {
    icon: React.ReactNode;
    label: string;
    count: number;
    options: { value: string; label: string }[];
    paramKey: string;
    sel: Set<string>;
    optCounts: Record<string, number>;
  }) => (
    <Popover>
      <PopoverTrigger
        className={cn(
          "inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors [&_svg]:size-4",
          isSidebar && "w-full justify-between",
          count > 0
            ? "border-civic-blue bg-civic-blue-soft text-civic-blue"
            : "border-civic-line bg-white text-ink hover:bg-paper-deep",
        )}
      >
        {icon}
        {label}
        {count > 0 && <span className="font-semibold">({count})</span>}
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-1">
          {options.map((o) => (
            <label key={o.value} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-section">
              <input
                type="checkbox"
                checked={sel.has(o.value)}
                onChange={() => update(paramKey, o.value)}
                className="size-4 accent-[var(--color-forest)]"
              />
              <span className="flex-1 text-sm text-ink">{o.label}</span>
              <span className="text-xs text-meta">{optCounts[o.value] ?? 0}</span>
            </label>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
          <Button variant="tertiary" size="sm" onClick={() => reset(paramKey)}>Reset</Button>
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="space-y-4">
      {!hideSearch && (
        <div className="flex h-14 items-center gap-3 rounded-lg border border-line bg-white px-4">
          <Search className="size-5 text-meta" />
          <input
            defaultValue={params.get("q") ?? ""}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by keyword, skill, or interest"
            className="h-full flex-1 bg-transparent text-sm text-ink placeholder:text-meta focus:outline-none"
            aria-label="Search tasks"
          />
        </div>
      )}

      {/* Chip row */}
      <div className={cn("flex items-center gap-2 overflow-x-auto pb-1", isSidebar && "flex-col items-stretch overflow-visible")}>
        <Chip icon={<BadgeCheck />} label="Type"     count={typeSel.size} options={LISTING_TYPES} paramKey="type" sel={typeSel} optCounts={listingTypeCounts} />
        <Chip icon={<MapPin />}     label="Location" count={locSel.size}  options={LOCATIONS}     paramKey="loc"  sel={locSel}  optCounts={counts.location} />
        <Chip icon={<Tag />}        label="Category" count={catSel.size}  options={CATEGORIES}    paramKey="cat"  sel={catSel}  optCounts={counts.category} />
        {anyActive && (
          <button
            onClick={() => router.push(pathname)}
            className={cn(
              "ml-1 shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-sm font-medium text-civic-blue hover:underline",
              isSidebar && "text-left",
            )}
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
