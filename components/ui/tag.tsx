import { Laptop, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LocationKind, TaskCategory } from "@/lib/types";

/**
 * Which device a task category is built for. Gov-audit needs a real keyboard
 * and viewport for the accessibility checks; food-audit needs a phone camera
 * for the in-store photos. Everything else works on either.
 */
export type DeviceRequirement = "desktop" | "mobile" | "either";

export const DEVICE_FOR_CATEGORY: Record<TaskCategory, DeviceRequirement> = {
  "data-collection": "either",
  translation: "either",
  "civic-input": "either",
  "neighborhood-writing": "either",
  seminar: "either",
  "food-audit": "mobile",
  "gov-audit": "desktop",
  "ems-rate-research": "either",
  "community-service": "either",
  "citizen-science": "either",
};

/** Tag-ready label + icon for a category's device requirement, or null when
 *  the task runs equally well on either. */
export function deviceTagFor(category: TaskCategory): { label: string; icon: React.ReactNode } | null {
  const d = DEVICE_FOR_CATEGORY[category];
  if (d === "desktop") return { label: "Desktop", icon: <Laptop className="size-3" /> };
  if (d === "mobile") return { label: "Mobile", icon: <Smartphone className="size-3" /> };
  return null;
}

/** Pill version of the device requirement for task cards + detail headers. */
export function DeviceTag({ category, className }: { category: TaskCategory; className?: string }) {
  const d = deviceTagFor(category);
  if (!d) return null;
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full border border-line bg-section px-2.5 text-xs font-medium text-ink",
        className
      )}
    >
      {d.icon}
      {d.label}
    </span>
  );
}

export function HeadlineTag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full bg-terracotta px-2.5 text-xs font-medium text-white", className)}>
      {children}
    </span>
  );
}

export function SecondaryTag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full border border-line bg-section px-2.5 text-xs font-medium text-ink", className)}>
      {children}
    </span>
  );
}

export const LOCATION_LABEL: Record<LocationKind, string> = {
  online: "Remote",
  in_person: "In person",
  hybrid: "Hybrid",
};

export const CATEGORY_LABEL: Record<TaskCategory, string> = {
  "data-collection": "Field data",
  translation: "Translation",
  "civic-input": "Civic input",
  "neighborhood-writing": "Writing",
  seminar: "Learning",
  "food-audit": "Food prices",
  "gov-audit": "Website audit",
  "ems-rate-research": "EMS rates",
  "community-service": "Community service",
  "citizen-science": "Citizen science",
};
