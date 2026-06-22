import Link from "next/link";
import { FolderKanban, ArrowRight } from "lucide-react";
import { requireRecipient } from "@/lib/session";
import { listSubmissionsForUser, workHref, workStatus } from "@/lib/queries";
import { StatusPill } from "@/components/status-pill";
import { OrgThumb } from "@/components/org-thumb";
import { EmptyState } from "@/components/empty-state";
import { relativeTime } from "@/lib/time";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "My work — Tended" };

export default async function MyWorkPage() {
  const user = await requireRecipient();
  const { t } = await getDict();
  const subs = await listSubmissionsForUser(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold text-ink">{t.app.myWork.title}</h1>
        <p className="mt-1 text-body">{t.app.myWork.subhead}</p>
      </div>

      {subs.length === 0 ? (
        <EmptyState
          icon={<FolderKanban />}
          title={t.app.myWork.empty}
          ctaLabel={t.app.myWork.browse}
          ctaHref="/app/tasks"
        />
      ) : (
        <ul className="space-y-3">
          {subs.map((s) => (
            <li key={s.id}>
              <Link href={workHref(s)} className="flex items-center gap-4 rounded-lg border border-line bg-white p-4 transition-colors hover:bg-section hover:shadow-sm">
                <OrgThumb name={s.org.name} slug={s.org.slug} size={56} className="h-14 w-14" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{s.task.title}</p>
                  <p className="truncate text-sm text-body">{s.org.name}</p>
                  <p className="mt-0.5 text-xs text-meta">{t.app.myWork.updated} {relativeTime(s.submitted_at ?? s.first_started_at ?? s.committed_at)}</p>
                </div>
                <StatusPill status={workStatus(s)} />
                <ArrowRight className="size-4 shrink-0 text-meta" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
