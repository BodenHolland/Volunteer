import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/lib/cf";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import type { AuditRow } from "@/lib/food-audit";
import { DonePolling } from "./done-polling";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit submitted — Tended" };

export default async function AuditDonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const audit = await getDb()
    .prepare("SELECT * FROM audits WHERE id = ?")
    .bind(id)
    .first<AuditRow>();
  if (!audit) notFound();
  if (audit.user_id !== user.id) redirect("/unauthorized");

  return (
    <main className="mx-auto max-w-xl px-4 pt-12 pb-24 text-center">
      <p className="text-xs uppercase tracking-wide text-muted">Food access price audit</p>
      <h1 className="text-2xl font-semibold mt-1">Thanks — your audit is being verified.</h1>
      <p className="mt-3 text-muted">
        We&apos;re checking your photos and prices. Hours credit once verification passes — usually under a
        minute, though flagged audits can take 1–2 business days.
      </p>

      <DonePolling auditId={id} initialStatus={audit.validation_status} creditedHours={audit.credited_hours} />

      <div className="mt-8 flex gap-3 justify-center">
        <Button asChild>
          <Link href="/app">Back to dashboard</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/app/tasks">Find another task</Link>
        </Button>
      </div>
    </main>
  );
}
