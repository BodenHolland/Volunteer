import Link from "next/link";
import { Inbox, ListChecks, Clock, Users, ArrowRight } from "lucide-react";
import { requireOrgMember } from "@/lib/session";
import { getOrg, getOrgDashboard, getDisplayNames } from "@/lib/queries";
import { StatusPill } from "@/components/status-pill";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { formatHours, monthLabel, relativeTime } from "@/lib/time";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Organization — colift" };

function Stat({ icon, value, label, href }: { icon: React.ReactNode; value: string | number; label: string; href?: string }) {
  const inner = (
    <div className="rounded-lg border border-line bg-white p-5 transition-colors hover:bg-section [&_svg]:size-5">
      <div className="flex items-center gap-2 text-sm font-medium text-meta">{icon}<span>{label}</span></div>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function OrgDashboardPage() {
  const { t } = await getDict();
  const user = await requireOrgMember();
  const org = user.org_id ? await getOrg(user.org_id) : null;
  if (!org) {
    return <EmptyState icon={<Inbox />} title={t.orgDashboard.noOrgLinked} />;
  }
  const data = await getOrgDashboard(org.id);
  const names = await getDisplayNames(data.recent.map((s) => s.user_id));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold text-ink">{t.orgDashboard.title}</h1>
        </div>
        {data.pendingCount > 0 && (
          <Button asChild>
            <Link href="/org/submissions?status=pending_review">
              <Inbox /> {t.orgDashboard.pendingAwaitingReview.replace("{count}", String(data.pendingCount))}
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={<Inbox />} value={data.pendingCount} label={t.orgDashboard.awaitingReviewStat} href="/org/submissions?status=pending_review" />
        <Stat icon={<ListChecks />} value={data.activeTasks} label={t.orgDashboard.activeTasks} href="/org/tasks" />
        <Stat icon={<Clock />} value={`${formatHours(data.hoursSponsored)}h`} label={t.orgDashboard.hoursMonthLabel.replace("{month}", monthLabel(data.month))} />
        <Stat icon={<Users />} value={data.recipientsServed} label={t.orgDashboard.recipientsServed} />
      </div>

      <section>
        <h2 className="mb-3 text-[22px] font-semibold text-ink">{t.orgDashboard.recentActivity}</h2>
        {data.recent.length === 0 ? (
          <EmptyState icon={<Inbox />} title={t.orgDashboard.emptyQueue} />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
            {data.recent.map((s) => (
              <li key={s.id}>
                <Link href={`/org/submissions/${s.id}`} className="flex items-center gap-4 p-4 hover:bg-section">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{s.task.title}</p>
                    <p className="truncate text-sm text-body">{names.get(s.user_id) ?? t.orgDashboard.aVolunteer} · {relativeTime(s.submitted_at ?? s.committed_at)}</p>
                  </div>
                  <StatusPill status={s.status} />
                  <ArrowRight className="size-4 shrink-0 text-meta" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
