import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/lib/cf";
import { requireUser } from "@/lib/session";
import { getDict } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import type { AuditRow } from "@/lib/food-audit";
import { DonePolling, type DoneCopy } from "./done-polling";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit submitted | colift" };

export default async function AuditDonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const { locale, t } = await getDict();
  const audit = await getDb()
    .prepare("SELECT * FROM audits WHERE id = ?")
    .bind(id)
    .first<AuditRow>();
  if (!audit) notFound();
  if (audit.user_id !== user.id) redirect("/unauthorized");

  return (
    <div className="mx-auto max-w-xl pb-24 pt-4 text-center">
      <h1 className="text-[28px] font-semibold text-ink">{t.auditDone.title}</h1>
      <p className="mt-3 text-body">{t.auditDone.body}</p>

      <DonePolling
        auditId={id}
        initialStatus={audit.validation_status}
        creditedHours={audit.credited_hours}
        copy={t.auditDone as unknown as DoneCopy}
      />

      <div className="mt-8 flex gap-3 justify-center">
        <Button asChild>
          <Link href="/app">{t.auditDone.backToDashboard}</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/opportunities">{t.auditDone.findAnother}</Link>
        </Button>
      </div>
    </div>
  );
}
