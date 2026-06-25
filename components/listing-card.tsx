import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LOCATION_LABEL, CATEGORY_LABEL, deviceTagFor } from "@/components/ui/tag";
import { relativeTime } from "@/lib/time";
import type { LocationKind, TaskCategory } from "@/lib/types";

const TASK_IMAGES: Record<string, string> = {
  task_ems_rates: "/ems-rates-icon.ico",
  task_food_audit: "/food-audit-icon.jpg",
  task_gov_audit: "/gov-audit-icon.png",
};

export interface ListingCardData {
  id: string;
  href: string;
  title: string;
  orgName: string;
  orgSlug?: string;
  orgLogoUrl?: string | null;
  category: TaskCategory;
  location: LocationKind;
  listingType?: "native" | "external";
  createdAt: number;
  closesAt?: number | null;
  featured?: boolean;
}

/**
 * Task card — bulletin-board feel with a quiet Civic Blue left rail.
 */
export function ListingCard({ task }: { task: ListingCardData }) {
  return (
    <article className="card-task group mb-3 last:mb-0">
      <Link href={task.href} className="block px-5 py-5 sm:px-6">
        <div className="flex items-start gap-4">
          {TASK_IMAGES[task.id] ? (
            <span className="flex size-12 shrink-0 rounded-md overflow-hidden border border-civic-line bg-white">
              <Image src={TASK_IMAGES[task.id]} alt="" width={48} height={48} className="h-full w-full object-cover" />
            </span>
          ) : task.orgLogoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={task.orgLogoUrl}
              alt={task.orgName}
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-md border border-civic-line bg-white object-contain p-1"
            />
          ) : (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-civic-blue-soft text-sm font-bold text-civic-blue">
              {task.orgName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug text-ink group-hover:text-civic-blue">
                {task.title}
              </h3>
              <ArrowUpRight
                className="mt-1 size-4 shrink-0 text-slate-soft transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-civic-blue"
                aria-hidden
              />
            </div>
            <p className="mt-1 text-sm font-medium text-slate">{task.orgName}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-slate">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="size-1 rounded-full bg-slate-soft" />
                {LOCATION_LABEL[task.location]}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="size-1 rounded-full bg-slate-soft" />
                {CATEGORY_LABEL[task.category]}
              </span>
              {(() => {
                const d = deviceTagFor(task.category);
                return d ? (
                  <span className="inline-flex items-center gap-1">
                    {d.icon}
                    {d.label}
                  </span>
                ) : null;
              })()}
              {task.listingType === "native" && (
                <span className="inline-flex items-center gap-1 font-medium text-field-green">
                  <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden><path d="M2 6.5l2.5 2.5L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                  Certification eligible
                </span>
              )}
              {task.listingType === "external" && (
                <span className="text-slate-soft">External opportunity</span>
              )}
              {task.featured && (
                <span className="rounded-sm bg-notice-yellow-soft px-1.5 py-0.5 text-[12px] font-medium text-ink">
                  Featured
                </span>
              )}
            </div>
            {task.closesAt && (
              <p className="mt-2 text-xs text-slate-soft">Closes {relativeTime(task.closesAt)}</p>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
