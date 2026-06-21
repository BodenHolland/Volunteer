import Link from "next/link";
import { Download, FolderKanban, ArrowRight, Sparkles, ClipboardList, CircleHelp, Settings } from "lucide-react";
import { requireRecipient } from "@/lib/session";
import { getRecipientDashboard } from "@/lib/queries";
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
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="service-heading text-3xl">
            {t.app.dashboard.greeting}, {user.full_name?.split(" ")[0] ?? t.app.dashboard.greetingFallback}
          </h1>
          <p className="mt-1 text-body">{t.app.dashboard.subhead}</p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/app/tasks">{t.app.dashboard.browseTasks} <ArrowRight /></Link>
        </Button>
      </div>

      {/* Hours summary */}
      <section className="service-panel overflow-hidden">
        <div className="border-b border-line bg-teal-subtle px-6 py-4">
          <p className="font-semibold text-ink">Civic work progress</p>
          <p className="mt-0.5 text-sm text-body">{monthLabel(data.month)} activity summary</p>
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
                    <Download /> Download this month&apos;s CF 888
                  </a>
                ) : (
                  <span aria-disabled className="cursor-not-allowed opacity-50"><Download /> Download this month&apos;s CF 888</span>
                )}
              </Button>
              <p className="mt-2 max-w-[260px] text-xs text-meta md:ml-auto">
                {canDownload
                  ? "Pre-filled with your details. Upload it to your benefits portal yourself."
                  : "Available once at least one hour is certified."}
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
              <p className="text-body">volunteered with us</p>
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
                  href={`/app/projects/${s.id}`}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-teal-subtle/60"
                >
                  <OrgThumb name={s.org.name} slug={s.org.slug} size={56} className="h-14 w-14" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{s.task.title}</p>
                    <p className="truncate text-sm text-body">{s.org.name}</p>
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

      <aside className="space-y-4 xl:pt-[75px]">
        <section className="service-panel overflow-hidden">
          <div className="border-b border-line bg-section px-5 py-4">
            <p className="font-semibold text-ink">Next steps</p>
          </div>
          <div className="divide-y divide-line">
            <Link href="/app/tasks" className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-ink hover:bg-section">
              <Sparkles className="size-5 text-forest" /> Browse available tasks <ArrowRight className="ml-auto size-4 text-meta" />
            </Link>
            <Link href="/app/projects" className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-ink hover:bg-section">
              <ClipboardList className="size-5 text-forest" /> View your projects <ArrowRight className="ml-auto size-4 text-meta" />
            </Link>
            <Link href="/app/settings" className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-ink hover:bg-section">
              <Settings className="size-5 text-forest" /> Account settings <ArrowRight className="ml-auto size-4 text-meta" />
            </Link>
          </div>
        </section>
        <section className="rounded-lg border border-teal/20 bg-teal-subtle p-5">
          <div className="flex items-center gap-2 text-ink"><CircleHelp className="size-5 text-forest" /><p className="font-semibold">Helpful resources</p></div>
          <p className="mt-2 text-sm leading-relaxed text-body">Review a task&apos;s checklist before you commit so you know exactly what to submit.</p>
          <Link href="/how-it-works" className="mt-3 inline-flex text-sm font-medium text-forest hover:underline">How Tended works <ArrowRight className="ml-1 size-4" /></Link>
        </section>
      </aside>
    </div>
  );
}
