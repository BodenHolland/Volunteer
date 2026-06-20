import Link from "next/link";
import { Inbox, ArrowRight } from "lucide-react";
import { requireRecipient } from "@/lib/session";
import { listSubmissionsForUser } from "@/lib/queries";
import { StatusPill } from "@/components/status-pill";
import { OrgThumb } from "@/components/org-thumb";
import { EmptyState } from "@/components/empty-state";
import { relativeTime } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Submission history — Tended" };

export default async function SubmissionHistoryPage() {
  const user = await requireRecipient();
  const subs = (await listSubmissionsForUser(user.id)).filter((s) =>
    ["submitted", "ai_reviewing", "pending_review", "approved", "rejected", "needs_changes"].includes(s.status)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold text-ink">Submission history</h1>
        <p className="mt-1 text-body">Work you&apos;ve sent for review.</p>
      </div>

      {subs.length === 0 ? (
        <EmptyState icon={<Inbox />} title="No submissions yet. Finish a project and submit it to see it here." ctaLabel="Your projects" ctaHref="/app/projects" />
      ) : (
        <ul className="space-y-3">
          {subs.map((s) => (
            <li key={s.id}>
              <Link href={`/app/submissions/${s.id}`} className="flex items-center gap-4 rounded-lg border border-line bg-white p-4 transition-colors hover:bg-section hover:shadow-sm">
                <OrgThumb name={s.org.name} slug={s.org.slug} size={56} className="h-14 w-14" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{s.task.title}</p>
                  <p className="truncate text-sm text-body">{s.org.name}</p>
                  <p className="mt-0.5 text-xs text-meta">Submitted {relativeTime(s.submitted_at ?? s.committed_at)}</p>
                </div>
                <StatusPill status={s.status} />
                <ArrowRight className="size-4 shrink-0 text-meta" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
