import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/lib/cf";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { commitToTask } from "@/app/app/project-actions";
import type { GovAuditSessionRow } from "@/lib/gov-audit";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit submitted | colift" };

export default async function GovAuditDonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const { t } = await getDict();
  const session = await getDb()
    .prepare("SELECT * FROM gov_audit_sessions WHERE id = ?")
    .bind(id)
    .first<GovAuditSessionRow>();
  if (!session) notFound();
  if (session.user_id !== user.id) redirect("/unauthorized");
  if (session.status === "in_progress") redirect(`/app/gov-audits/${id}`);

  const flagged = session.status === "flagged";
  const certMin = session.certified_minutes ?? 0;
  const integrityPct = session.integrity_score != null ? Math.round(session.integrity_score * 100) : null;

  return (
    <div className="mx-auto max-w-2xl py-10">
      <h1 className="text-[28px] font-semibold leading-tight text-ink">
        {flagged ? t.govAuditDone.titleFlagged : t.govAuditDone.titleApproved}
      </h1>
      <p className="mt-3 text-body">
        {flagged ? t.govAuditDone.descFlagged : t.govAuditDone.descApproved}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-line bg-white p-4">
          <dt className="text-[13px] text-body">{t.govAuditDone.certifiedTime}</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {t.govAuditDone.certifiedMinutes.replace("{n}", String(certMin))}
          </dd>
          <p className="mt-1 text-xs text-body">{t.govAuditDone.certifiedTimeCaption}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4">
          <dt className="text-[13px] text-body">{t.govAuditDone.integrityScore}</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {integrityPct != null ? `${integrityPct}%` : ""}
          </dd>
          <p className="mt-1 text-xs text-body">{t.govAuditDone.integrityScoreCaption}</p>
        </div>
      </dl>

      <div className="mt-6 rounded-lg border border-line bg-section p-4 text-sm text-body">
        {t.govAuditDone.datasetNotePre}
        <Link href="/data" className="font-medium text-navy underline underline-offset-4">
          {t.govAuditDone.datasetLink}
        </Link>
        {t.govAuditDone.datasetNotePost}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/app">{t.govAuditDone.backToDashboard}</Link>
        </Button>
        <form action={commitToTask}>
          <input type="hidden" name="task_id" value={session.task_template_id} />
          <Button type="submit">{t.govAuditDone.auditAnother}</Button>
        </form>
        <Button asChild variant="ghost">
          <Link href="/opportunities">{t.govAuditDone.findDifferentTask}</Link>
        </Button>
      </div>
    </div>
  );
}
