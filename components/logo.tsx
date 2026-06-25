import Image from "next/image";
import { cn } from "@/lib/utils";

export function LogoMark({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/colift-icon.png"
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
    />
  );
}

export function Logo({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-ink", className)}>
      <LogoMark size={size} />
      <span className="text-[17px] font-semibold tracking-tight">colift</span>
    </span>
  );
}
