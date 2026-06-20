import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon,
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  icon: React.ReactNode;
  title: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-white px-6 py-16 text-center">
      <div className="text-meta [&_svg]:size-8" aria-hidden>
        {icon}
      </div>
      <p className="mt-4 text-base font-medium text-ink">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-body">{body}</p>}
      {ctaLabel && ctaHref && (
        <Button asChild className="mt-5">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      )}
    </div>
  );
}
