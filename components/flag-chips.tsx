import { ShieldCheck } from "lucide-react";
import { FLAG_LABELS, type FlagKind } from "@/lib/fraud";
import { cn } from "@/lib/utils";

export function FlagChips({ flags }: { flags: { kind: FlagKind; severity?: string }[] }) {
  if (flags.length === 0) {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-forest-subtle px-2.5 text-xs font-medium text-forest">
        <ShieldCheck className="size-3.5" /> No flags raised
      </span>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {flags.map((f, i) => {
        const info = FLAG_LABELS[f.kind];
        if (!info) return null;
        return (
          <span
            key={i}
            className={cn(
              "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium",
              info.tone === "error" ? "bg-brick-subtle text-brick" : "bg-amber-subtle text-amber"
            )}
          >
            {info.label}
          </span>
        );
      })}
    </div>
  );
}
