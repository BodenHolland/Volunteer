import Link from "next/link";
import { Inbox, ListChecks, Clock, Users, ArrowRight } from "lucide-react";
import { requireOrgMember } from "@/lib/session";
import { getOrg, getOrgDashboard, getDisplayNames } from "@/lib/queries";
import { StatusPill } from "@/components/status-pill";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { formatHours, monthLabel, relativeTime } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Organization — Tended" };

function Stat({ icon, value, label, href }: { icon: React.ReactNode; value: string | number; label: string; href?: string }) {
  const inner = (
    <div className="rounded-lg border border-line bg-white p-5 transition-colors hover:bg-section [&_svg]:size-5">
      <div className="flex items-center gap-2 text-meta">{icon}<span className="overline">{label}</span></div>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function OrgDashboardPage() {
  const user = await requireOrgMember();
  const org = user.org_id ? await getOrg(user.org_id) : null;
  if (!org) {
    return <EmptyState icon={<Inbox />} title="No organization linked to this account." />;
  }
  const data = await getOrgDashboard(org.id);
  const names = await getDisplayNames(data.recent.map((s) => s.user_id));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="overline mb-1">{org.name}</p>
          <h1 className="text-[28px] font-semibold text-ink">Review dashboard</h1>
        </div>
        {data.pendingCount > 0 && (
          <Button asChild>
            <Link href="/org/submissions?status=pending_review">
              <Inbox /> {data.pendingCount} awaiting review
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={<Inbox />} value={data.pendingCount} label="Awaiting review" href="/org/submissions?status=pending_review" />
        <Stat icon={<ListChecks />} value={data.activeTasks} label="Active tasks" href="/org/tasks" />
        <Stat icon={<Clock />} value={`${formatHours(data.hoursSponsored)}h`} label={`Hours · ${monthLabel(data.month)}`} />
        <Stat icon={<Users />} value={data.recipientsServed} label="Recipients served" />
      </div>

      <section>
        <h2 className="mb-3 text-[22px] font-semibold text-ink">Recent activity</h2>
        {data.recent.length === 0 ? (
          <EmptyState icon={<Inbox />} title="Queue is empty. New submissions appear here when recipients submit work." />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
            {data.recent.map((s) => (
              <li key={s.id}>
                <Link href={`/org/submissions/${s.id}`} className="flex items-center gap-4 p-4 hover:bg-section">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{s.task.title}</p>
                    <p className="truncate text-sm text-body">{names.get(s.user_id) ?? "A volunteer"} · {relativeTime(s.submitted_at ?? s.committed_at)}</p>
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
