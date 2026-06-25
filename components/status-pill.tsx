import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type PillSpec = { label: string; cls: string; check?: boolean; pulse?: boolean };

// Covers both submission statuses and food-audit `validation_status` values so a
// single pill renders any committed work item.
const MAP: Record<string, PillSpec> = {
  committed: { label: "Committed", cls: "bg-section text-ink" },
  in_progress: { label: "In progress", cls: "bg-forest-subtle text-forest" },
  submitted: { label: "Submitted", cls: "bg-amber-subtle text-amber" },
  ai_reviewing: { label: "AI reviewing", cls: "bg-amber-subtle text-amber", pulse: true },
  pending_review: { label: "Awaiting nonprofit", cls: "bg-amber-subtle text-amber" },
  approved: { label: "Certified", cls: "bg-forest-subtle text-forest", check: true },
  rejected: { label: "Needs another try", cls: "bg-brick-subtle text-brick" },
  needs_changes: { label: "Needs another try", cls: "bg-brick-subtle text-brick" },
  // audit validation_status values
  draft: { label: "Draft", cls: "bg-section text-ink" },
  validating: { label: "Reviewing", cls: "bg-amber-subtle text-amber", pulse: true },
  verified: { label: "Certified", cls: "bg-forest-subtle text-forest", check: true },
  flagged: { label: "Awaiting nonprofit", cls: "bg-amber-subtle text-amber" },
};

const FALLBACK: PillSpec = { label: "In progress", cls: "bg-section text-ink" };

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const s = MAP[status] ?? FALLBACK;
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium",
        s.cls,
        s.pulse && "animate-colift-pulse",
        className
      )}
    >
      {s.check && <Check className="size-3" aria-hidden="true" />}
      {s.label}
    </span>
  );
}
