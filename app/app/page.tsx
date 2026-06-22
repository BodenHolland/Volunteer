import Link from "next/link";
import { Download, FolderKanban, ArrowRight, Sparkles } from "lucide-react";
import { requireRecipient } from "@/lib/session";
import { getRecipientDashboard, workHref, workStatus } from "@/lib/queries";
import { ProgressRing } from "@/components/progress-ring";
import { StatusPill } from "@/components/status-pill";
import { EmptyState } from "@/components/empty-state";
import { OrgThumb } from "@/components/org-thumb";
import { Button } from "@/components/ui/button";
import { MONTHLY_HOURS_TARGET } from "@/lib/types";
import { formatHours, monthLabel } from "@/lib/time";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — Tended" };

export default async function DashboardPage() {
  const user = await requireRecipient();
  const { t } = await getDict();
  const data = await getRecipientDashboard(user.id);
  const isSnap = user.intent === "snap_cert";
  const total = data.certified + data.pending;
  const canDownload = data.certified >= 1;

  return (
    <div className="mx-auto min-w-0 max-w-3xl space-y-7">
      <div>
        <h1 className="service-heading text-3xl">
          {t.app.dashboard.greeting}, {user.full_name?.split(" ")[0] ?? t.app.dashboard.greetingFallback}
        </h1>
        <p className="mt-1 text-body">{t.app.dashboard.subhead}</p>
      </div>

      {/* Hours summary */}
      <section className="service-panel overflow-hidden">
        <div className="border-b border-line bg-teal-subtle px-6 py-4">
          <p className="font-semibold text-ink">{t.app.dashboard.progress}</p>
          <p className="mt-0.5 text-sm text-body">{monthLabel(data.month)} {t.app.dashboard.activitySummary}</p>
        </div>
        <div className="p-6">
        {isSnap ? (
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <ProgressRing
              certified={data.certified}
              pending={data.pending}
              target={MONTHLY_HOURS_TARGET}
              caption={`You're ${formatHours(total)} of ${MONTHLY_HOURS_TARGET} hours`}
              sub={`this month · ${monthLabel(data.month)}`}
            />
            <div className="md:text-right">
              <Button asChild disabled={!canDownload} variant="accent" className="data-[disabled]:opacity-50">
                {canDownload ? (
                  <a href={`/api/cf888?month=${data.month}`} target="_blank" rel="noreferrer">
                    <Download /> {t.app.dashboard.downloadCf888}
                  </a>
                ) : (
                  <span aria-disabled className="cursor-not-allowed opacity-50"><Download /> {t.app.dashboard.downloadCf888}</span>
                )}
              </Button>
              <p className="mt-2 max-w-[260px] text-xs text-meta md:ml-auto">
                {canDownload
                  ? t.app.dashboard.cf888Ready
                  : t.app.dashboard.cf888Locked}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-5">
            <div className="flex size-20 items-center justify-center rounded-full bg-forest-subtle text-forest">
              <Sparkles className="size-8" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-3xl font-semibold text-ink">{formatHours(data.certified)} hours</p>
              <p className="text-body">{t.app.dashboard.hoursVolunteered}</p>
            </div>
          </div>
        )}
        </div>
      </section>

      {/* Active projects */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="service-heading text-xl">{t.app.dashboard.activeProjects}</h2>
        </div>
        {data.active.length === 0 ? (
          <EmptyState
            icon={<FolderKanban />}
            title={t.app.dashboard.emptyTitle}
            ctaLabel={t.app.dashboard.browseTasks}
            ctaHref="/app/tasks"
          />
        ) : (
          <ul className="service-panel divide-y divide-line overflow-hidden">
            {data.active.map((s) => (
              <li key={s.id}>
                <Link
                  href={workHref(s)}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-teal-subtle/60"
                >
                  <OrgThumb name={s.org.name} slug={s.org.slug} size={56} className="h-14 w-14" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{s.task.title}</p>
                    <p className="truncate text-sm text-body">{s.org.name}</p>
                  </div>
                  <StatusPill status={workStatus(s)} />
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
