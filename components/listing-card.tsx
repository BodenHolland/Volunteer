import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import { OrgThumb } from "@/components/org-thumb";
import { BookmarkButton } from "@/components/bookmark-button";
import { HeadlineTag, SecondaryTag, LOCATION_LABEL, CATEGORY_LABEL } from "@/components/ui/tag";
import { formatHours, relativeTime } from "@/lib/time";
import type { LocationKind, TaskCategory } from "@/lib/types";

export interface ListingCardData {
  id: string;
  href: string;
  title: string;
  orgName: string;
  orgSlug?: string;
  category: TaskCategory;
  location: LocationKind;
  estHours: number;
  maxHours: number;
  createdAt: number;
  featured?: boolean;
}

export function ListingCard({ task }: { task: ListingCardData }) {
  return (
    <Link
      href={task.href}
      className="group relative block rounded-lg border border-line bg-white p-5 transition-colors hover:bg-section hover:shadow-sm md:p-6"
    >
      <div className="absolute right-4 top-4">
        <BookmarkButton label={task.title} />
      </div>
      <div className="flex gap-4 md:gap-5">
        <OrgThumb
          name={task.orgName}
          slug={task.orgSlug}
          size={96}
          className="h-24 w-24 md:h-[120px] md:w-[120px]"
        />
        <div className="min-w-0 flex-1 pr-8">
          <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-ink">{task.title}</h3>
          <p className="mt-1 text-[15px] font-medium text-ink">{task.orgName}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <HeadlineTag>{LOCATION_LABEL[task.location]}</HeadlineTag>
            <SecondaryTag>{CATEGORY_LABEL[task.category]}</SecondaryTag>
            <SecondaryTag>
              <Clock className="mr-1 size-3" />
              {formatHours(task.estHours)}–{formatHours(task.maxHours)} hrs
            </SecondaryTag>
            {task.location !== "online" && (
              <SecondaryTag>
                <MapPin className="mr-1 size-3" />
                San Francisco
              </SecondaryTag>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[13px] text-meta">Posted {relativeTime(task.createdAt)}</span>
        {task.featured && <span className="overline rounded-full bg-section px-2 py-1">Featured</span>}
      </div>
    </Link>
  );
}
