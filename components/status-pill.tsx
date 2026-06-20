import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubmissionStatus } from "@/lib/types";

const MAP: Record<SubmissionStatus, { label: string; cls: string; check?: boolean; pulse?: boolean }> = {
  committed: { label: "Committed", cls: "bg-section text-ink" },
  in_progress: { label: "In progress", cls: "bg-forest-subtle text-forest" },
  submitted: { label: "Submitted", cls: "bg-amber-subtle text-amber" },
  ai_reviewing: { label: "AI reviewing", cls: "bg-amber-subtle text-amber", pulse: true },
  pending_review: { label: "Awaiting nonprofit", cls: "bg-amber-subtle text-amber" },
  approved: { label: "Certified", cls: "bg-forest-subtle text-forest", check: true },
  rejected: { label: "Needs another try", cls: "bg-brick-subtle text-brick" },
  needs_changes: { label: "Needs another try", cls: "bg-brick-subtle text-brick" },
};

export function StatusPill({ status, className }: { status: SubmissionStatus; className?: string }) {
  const s = MAP[status];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium",
        s.cls,
        s.pulse && "animate-tended-pulse",
        className
      )}
    >
      {s.check && <Check className="size-3" />}
      {s.label}
    </span>
  );
}
