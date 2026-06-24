import Link from "next/link";
import { LOCATION_LABEL, CATEGORY_LABEL, deviceTagFor } from "@/components/ui/tag";
import { relativeTime } from "@/lib/time";
import type { LocationKind, TaskCategory } from "@/lib/types";

export interface ListingCardData {
  id: string;
  href: string;
  title: string;
  orgName: string;
  orgSlug?: string;
  category: TaskCategory;
  location: LocationKind;
  createdAt: number;
  featured?: boolean;
}

export function ListingCard({ task }: { task: ListingCardData }) {
  return (
    <article className="group relative border-b border-line py-5 last:border-b-0 sm:px-1">
      <Link href={task.href} className="block focus-visible:outline-none">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-teal-subtle text-sm font-bold text-forest">
            {task.orgName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-ink group-hover:text-forest">{task.title}</h3>
            <p className="mt-1 text-sm font-medium text-body">{task.orgName}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-meta">
              <span>{LOCATION_LABEL[task.location]}</span>
              <span>{CATEGORY_LABEL[task.category]}</span>
              {(() => {
                const d = deviceTagFor(task.category);
                return d ? (
                  <span className="inline-flex items-center gap-1">
                    {d.icon}
                    {d.label}
                  </span>
                ) : null;
              })()}
              {task.featured && <span className="font-medium text-amber">Featured</span>}
            </div>
          </div>
        </div>
        <span className="mt-3 block text-xs text-meta">Posted {relativeTime(task.createdAt)}</span>
      </Link>
    </article>
  );
}
