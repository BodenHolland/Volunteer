import Link from "next/link";
import { Inbox, ArrowRight, AlertTriangle } from "lucide-react";
import { requireOrgMember } from "@/lib/session";
import { getOrg, listSubmissionsForOrg, getDisplayNames } from "@/lib/queries";
import { StatusPill } from "@/components/status-pill";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/time";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review queue | colift" };

export default async function OrgQueuePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = sp.status ?? "pending_review";
  const user = await requireOrgMember();
  const org = user.org_id ? await getOrg(user.org_id) : null;
  const { t } = await getDict();

  const FILTERS = [
    { value: "pending_review", label: t.reviewQueue.filterAwaitingReview },
    { value: "approved", label: t.reviewQueue.filterApproved },
    { value: "needs_changes", label: t.reviewQueue.filterNeedsChanges },
    { value: "rejected", label: t.reviewQueue.filterRejected },
    { value: "all", label: t.reviewQueue.filterAll },
  ];

  if (!org) return <EmptyState icon={<Inbox />} title={t.reviewQueue.noOrgLinked} />;

  const subs = await listSubmissionsForOrg(org.id, status);
  const names = await getDisplayNames(subs.map((s) => s.user_id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold text-ink">{t.reviewQueue.title}</h1>
        <p className="mt-1 text-body">{t.reviewQueue.subhead.replace("{org}", org.name)}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/org/submissions?status=${f.value}`}
            className={cn(
              "inline-flex h-9 items-center rounded-full border px-3 text-sm font-medium",
              status === f.value ? "border-forest bg-forest-subtle text-forest" : "border-line bg-white text-ink hover:bg-section"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {subs.length === 0 ? (
        <EmptyState icon={<Inbox />} title={t.reviewQueue.emptyState} />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
          {subs.map((s) => {
            const verdict = s.ai_verdict_json ? JSON.parse(s.ai_verdict_json) : null;
            return (
              <li key={s.id}>
                <Link href={`/org/submissions/${s.id}`} className="flex items-center gap-4 p-4 hover:bg-section">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{s.task.title}</p>
                    <p className="truncate text-sm text-body">
                      {names.get(s.user_id) ?? t.reviewQueue.volunteerFallback} · {t.reviewQueue.submitted} {relativeTime(s.submitted_at ?? s.committed_at)}
                    </p>
                  </div>
                  {verdict?.verdict === "flag" && (
                    <span className="hidden items-center gap-1 text-xs text-amber sm:flex"><AlertTriangle className="size-3.5" /> {t.reviewQueue.needsALook}</span>
                  )}
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
