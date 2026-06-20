import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold text-forest", className)}>
      <Sprout style={{ width: size, height: size }} strokeWidth={1.75} aria-hidden />
      <span>Tended</span>
    </span>
  );
}
