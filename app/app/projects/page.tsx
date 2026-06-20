import Link from "next/link";
import { FolderKanban, ArrowRight } from "lucide-react";
import { requireRecipient } from "@/lib/session";
import { listSubmissionsForUser } from "@/lib/queries";
import { StatusPill } from "@/components/status-pill";
import { OrgThumb } from "@/components/org-thumb";
import { EmptyState } from "@/components/empty-state";
import { relativeTime } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects — Tended" };

export default async function ProjectsPage() {
  const user = await requireRecipient();
  const subs = await listSubmissionsForUser(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold text-ink">Your projects</h1>
        <p className="mt-1 text-body">Everything you&apos;ve committed to, in progress, or submitted.</p>
      </div>

      {subs.length === 0 ? (
        <EmptyState
          icon={<FolderKanban />}
          title="No tasks committed yet. Browse the catalog to find one near you."
          ctaLabel="Browse tasks"
          ctaHref="/app/tasks"
        />
      ) : (
        <ul className="space-y-3">
          {subs.map((s) => {
            const href = ["committed", "in_progress", "needs_changes"].includes(s.status)
              ? `/app/projects/${s.id}`
              : `/app/submissions/${s.id}`;
            return (
              <li key={s.id}>
                <Link href={href} className="flex items-center gap-4 rounded-lg border border-line bg-white p-4 transition-colors hover:bg-section hover:shadow-sm">
                  <OrgThumb name={s.org.name} slug={s.org.slug} size={56} className="h-14 w-14" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{s.task.title}</p>
                    <p className="truncate text-sm text-body">{s.org.name}</p>
                    <p className="mt-0.5 text-xs text-meta">Updated {relativeTime(s.submitted_at ?? s.first_started_at ?? s.committed_at)}</p>
                  </div>
                  <StatusPill status={s.status} />
                  <ArrowRight className="size-4 shrink-0 text-meta" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
