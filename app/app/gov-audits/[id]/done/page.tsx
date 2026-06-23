import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/lib/cf";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { commitToTask } from "@/app/app/project-actions";
import type { GovAuditSessionRow } from "@/lib/gov-audit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit submitted — Tended" };

export default async function GovAuditDonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
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
      <p className="text-xs font-semibold uppercase tracking-wide text-terracotta">Government website audit</p>
      <h1 className="mt-2 text-[28px] font-semibold leading-tight text-ink">
        {flagged ? "Submitted — flagged for review" : "Thanks — your audit is in for review."}
      </h1>
      <p className="mt-3 text-body">
        {flagged
          ? "Your audit was submitted but flagged for a human spot-check (non-desktop device, or your self-report didn't line up with our automated checks). If it clears review, your time will be credited."
          : "Your structured audit was submitted and the server ran automated accessibility checks against the same page. Time credits to your SNAP hours once a reviewer approves it."}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-line bg-white p-4">
          <dt className="text-xs uppercase tracking-wide text-body">Certified time</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">{certMin} min</dd>
          <p className="mt-1 text-xs text-body">Capped at 20 min per page, gated on a complete rubric.</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4">
          <dt className="text-xs uppercase tracking-wide text-body">Integrity score</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {integrityPct != null ? `${integrityPct}%` : "—"}
          </dd>
          <p className="mt-1 text-xs text-body">Rubric completeness × automated-check corroboration.</p>
        </div>
      </dl>

      <div className="mt-6 rounded-lg border border-line bg-section p-4 text-sm text-body">
        Your findings (minus any free-text pending moderation) flow into the free, public{" "}
        <Link href="/data" className="font-medium text-navy underline underline-offset-4">
          government-website audit dataset
        </Link>{" "}
        — a public good for the offices that run these pages.
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/app">Back to dashboard</Link>
        </Button>
        <form action={commitToTask}>
          <input type="hidden" name="task_id" value={session.task_template_id} />
          <Button type="submit">Audit another URL</Button>
        </form>
        <Button asChild variant="ghost">
          <Link href="/app/tasks">Find a different task</Link>
        </Button>
      </div>
    </div>
  );
}
