import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, Upload, Clock, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { requireRecipient } from "@/lib/session";
import { getSubmission } from "@/lib/queries";
import { ZOONIVERSE_TASK_DETAIL_DISCLAIMER, ZOONIVERSE_HOMEPAGE_URL } from "@/lib/zooniverse";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { Markdown } from "@/components/markdown";

export const dynamic = "force-dynamic";
export const metadata = { title: "Zooniverse task | colift" };

export default async function ExternalHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const notice =
    sp.notice === "duplicate"
      ? "This certificate file matches a previous upload, so we sent it to a reviewer to take a look."
      : sp.notice;
  const me = await requireRecipient();
  const sub = await getSubmission(id);
  if (!sub) notFound();
  if (sub.user_id !== me.id) redirect("/unauthorized");
  if (sub.task.evidence_mode !== "external_certificate") {
    redirect(`/app/projects/${id}`);
  }

  const canSubmit = sub.status === "committed" || sub.status === "in_progress" || sub.status === "needs_changes";
  const capMinutes = sub.task.monthly_minutes_cap;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/opportunities" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">
        <ArrowLeft className="size-4" /> All tasks
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-[28px] font-semibold leading-tight text-ink">{sub.task.title}</h1>
        <StatusPill status={sub.status} />
      </div>
      <p className="mt-1 text-sm text-body">{sub.org.name}</p>

      {notice && (
        <p className="mt-4 rounded-md border border-amber/30 bg-amber-subtle p-3 text-sm text-body">
          <AlertCircle className="mr-1 inline size-4 align-text-bottom text-amber" />
          {notice} A reviewer will get to it shortly.
        </p>
      )}

      <p className="mt-6 rounded-md bg-amber-subtle p-3 text-xs text-body">
        <ShieldCheck className="mr-1 inline size-3.5 align-text-bottom text-amber" />
        {ZOONIVERSE_TASK_DETAIL_DISCLAIMER}
      </p>

      <section className="mt-6 space-y-4">
        <div className="rounded-lg border border-line bg-white p-5">
          <p className="text-sm font-medium text-ink">Step 1, Pick a project and do the work</p>
          <p className="mt-1 text-sm text-body">
            Open Zooniverse, sign into your own account, and pick any project that interests you 
            wildlife, weather diaries, galaxies, historical documents, anything. Classify as much as you
            want in one session. When you stop for the month, generate a Volunteer Certificate from your
            Zooniverse profile.
          </p>
          <a
            href={ZOONIVERSE_HOMEPAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest/90"
          >
            <ExternalLink className="size-4" /> Open Zooniverse
          </a>
        </div>

        <div className="rounded-lg border border-line bg-white p-5">
          <p className="text-sm font-medium text-ink">Step 2, Upload your certificate</p>
          <p className="mt-1 text-sm text-body">
            colift verifies the certificate and credits the hours Zooniverse recorded
            {capMinutes != null ? `, up to ${Math.round(capMinutes / 60)} hours per month per project` : ", no artificial cap"}.
          </p>
          {canSubmit ? (
            <Link href={`/app/external/${id}/submit`} className="mt-4 inline-flex">
              <Button>
                <Upload className="size-4" /> Upload certificate
              </Button>
            </Link>
          ) : sub.status === "pending_review" || sub.status === "ai_reviewing" ? (
            <p className="mt-4 flex items-center gap-1.5 text-sm text-body">
              <Clock className="size-4 text-amber" /> Your certificate is in the review queue.
            </p>
          ) : sub.status === "approved" ? (
            <p className="mt-4 flex items-center gap-1.5 text-sm text-forest">
              <CheckCircle2 className="size-4" /> Approved, {sub.hours_credited ?? 0}h credited.
            </p>
          ) : sub.status === "rejected" ? (
            <p className="mt-4 flex items-center gap-1.5 text-sm text-brick">
              <AlertCircle className="size-4" /> Rejected. {sub.reviewer_notes ?? ""}
            </p>
          ) : null}
          {sub.status === "needs_changes" && sub.reviewer_notes && (
            <p className="mt-3 rounded-md border border-amber/30 bg-amber-subtle p-3 text-sm text-body">
              <strong>Reviewer asked for changes:</strong> {sub.reviewer_notes}
            </p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-lg font-semibold text-ink">About this task</h2>
        <Markdown>{sub.task.instructions_md}</Markdown>
      </section>
    </div>
  );
}
