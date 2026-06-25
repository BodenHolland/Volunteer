import { cn } from "@/lib/utils";

/**
 * colift civic mark — a soft-cornered map marker with a checkmark inside.
 * Reads as a verified place / completed task; scales to 16px favicon.
 */
export function LogoMark({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M5 4.25C5 3.56 5.56 3 6.25 3h11.5C18.44 3 19 3.56 19 4.25v10.5c0 .69-.56 1.25-1.25 1.25h-3.4l-2.16 4.42a.25.25 0 0 1-.45 0L9.58 16H6.25C5.56 16 5 15.44 5 14.75V4.25Z"
        fill="currentColor"
      />
      <path
        d="m8.25 9.6 2.45 2.45L15.55 7"
        stroke="var(--color-paper, #faf7f0)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
