import Link from "next/link";
import { Download, FolderKanban, ArrowRight, Sparkles } from "lucide-react";
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold text-ink">
            {t.app.dashboard.greeting}, {user.full_name?.split(" ")[0] ?? t.app.dashboard.greetingFallback}
          </h1>
          <p className="mt-1 text-body">{t.app.dashboard.subhead}</p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/app/tasks">{t.app.dashboard.browseTasks} <ArrowRight /></Link>
        </Button>
      </div>

      {/* Hours summary */}
      <section className="rounded-lg border border-line bg-white p-6">
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
      </section>

      {/* Active projects */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[22px] font-semibold text-ink">{t.app.dashboard.activeProjects}</h2>
        </div>
        {data.active.length === 0 ? (
          <EmptyState
            icon={<FolderKanban />}
            title={t.app.dashboard.emptyTitle}
            ctaLabel={t.app.dashboard.browseTasks}
            ctaHref="/app/tasks"
          />
        ) : (
          <ul className="space-y-3">
            {data.active.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/app/projects/${s.id}`}
                  className="flex items-center gap-4 rounded-lg border border-line bg-white p-4 transition-colors hover:bg-section hover:shadow-sm"
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
  );
}
