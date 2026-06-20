import { cn } from "@/lib/utils";
import type { LocationKind, TaskCategory } from "@/lib/types";

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
};
