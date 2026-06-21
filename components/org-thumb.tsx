import { Trees, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  "canopy-commons": Trees,
  "civic-data-collective": Building2,
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function OrgThumb({
  name,
  slug,
  size = 120,
  className,
}: {
  name: string;
  slug?: string;
  size?: number;
  className?: string;
}) {
  const Icon = slug ? ICONS[slug] : undefined;
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md border border-line bg-cream text-forest",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {Icon ? (
        <span className="opacity-90" style={{ width: size * 0.4, height: size * 0.4, display: "inline-flex" }}>
          <Icon className="h-full w-full" strokeWidth={1.5} />
        </span>
      ) : (
        <span className="font-semibold" style={{ fontSize: size * 0.32 }}>
          {initials(name)}
        </span>
      )}
    </div>
  );
}
