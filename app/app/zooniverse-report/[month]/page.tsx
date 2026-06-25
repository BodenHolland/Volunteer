import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRecipient } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { ZOONIVERSE_REPORT_DISCLAIMER, ORG_CITIZEN_SCIENCE } from "@/lib/zooniverse";
import { PrintButton } from "@/components/print-button";
import type { Submission, CertificateReview } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Zooniverse activity record — colift" };

interface Row {
  sub: Submission;
  review: CertificateReview | null;
  projectName: string;
  projectSlug: string;
  reviewerName: string | null;
}

export default async function ZooniverseReportPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  if (!/^\d{4}-\d{2}$/.test(month)) notFound();

  const me = await requireRecipient();
  const db = getDb();

  // All approved external-certificate submissions for this user where the
  // certificate review's reporting month matches.
  const subs =
    (await db
      .prepare(
        `SELECT s.* FROM submissions s
           JOIN task_templates t ON t.id = s.task_template_id
          WHERE s.user_id = ? AND s.status = 'approved'
            AND t.evidence_mode = 'external_certificate'`
      )
      .bind(me.id)
      .all<Submission>()).results ?? [];

  // Filter to this reporting month by reading certificate_reviews + file metadata.
  const rows: Row[] = [];
  for (const sub of subs) {
    const review = await db
      .prepare("SELECT * FROM certificate_reviews WHERE submission_id = ?")
      .bind(sub.id)
      .first<CertificateReview>();
    const fileRow = await db
      .prepare(
        "SELECT metadata_json FROM submission_files WHERE submission_id = ? AND kind = 'zooniverse_certificate' ORDER BY id DESC LIMIT 1"
      )
      .bind(sub.id)
      .first<{ metadata_json: string }>();
    let meta: { reporting_month?: string; project_name?: string; project_slug?: string } = {};
    try {
      meta = JSON.parse(fileRow?.metadata_json ?? "{}");
    } catch {
      meta = {};
    }
    let m = meta.reporting_month ?? "";
    if (!/^\d{4}-\d{2}$/.test(m) && sub.reviewed_at) {
      const d = new Date(sub.reviewed_at);
      m = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    }
    if (m !== month) continue;

    // Project info: prefer the public-cluster row (reviewer-confirmed), fall
    // back to volunteer's cert metadata.
    const publicRow = sub.public_session_ref
      ? await db
          .prepare(
            "SELECT external_project_slug, task_type_label FROM zooniverse_public_activity WHERE public_session_ref = ?"
          )
          .bind(sub.public_session_ref)
          .first<{ external_project_slug: string; task_type_label: string }>()
      : null;
    const projectName = publicRow?.task_type_label ?? meta.project_name ?? "Zooniverse project";
    const projectSlug = publicRow?.external_project_slug ?? meta.project_slug ?? "";

    const reviewer = review
      ? await db.prepare("SELECT full_name FROM users WHERE id = ?").bind(review.reviewer_id).first<{ full_name: string | null }>()
      : null;
    rows.push({ sub, review: review ?? null, projectName, projectSlug, reviewerName: reviewer?.full_name ?? null });
  }

  const totalMinutes = rows.reduce((acc, r) => acc + (r.review?.credited_minutes ?? 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

  const ledgerRow = await db
    .prepare(
      "SELECT total_hours FROM hours_ledger WHERE user_id = ? AND month = ? AND certified_org_id = ?"
    )
    .bind(me.id, month, ORG_CITIZEN_SCIENCE)
    .first<{ total_hours: number }>();
  const ledgerHours = ledgerRow?.total_hours ?? 0;

  const participantName = me.legal_name ?? me.full_name ?? me.email;
  const latestReviewedAt = rows
    .map((r) => r.sub.reviewed_at)
    .filter((t): t is number => t != null)
    .sort((a, b) => b - a)[0];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="print:hidden">
        <Link href="/app" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">
          <ArrowLeft className="size-4" /> Dashboard
        </Link>
      </div>

      <div className="rounded-lg border border-line bg-white p-8 print:border-0 print:p-0">
        <div className="flex items-start justify-between gap-3 print:hidden">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-meta">colift</p>
            <h1 className="text-2xl font-semibold text-ink">Civic Shift Activity Record</h1>
          </div>
          <PrintButton />
        </div>

        <div className="mt-6 space-y-3 text-sm leading-relaxed text-ink">
          <Field label="Participant" value={participantName} />
          <Field label="Reporting period" value={month} />
          <Field label="Provider" value="Zooniverse" />
          <Field
            label="Projects"
            value={
              rows.length === 0
                ? "—"
                : Array.from(new Set(rows.map((r) => r.projectName))).join(", ")
            }
          />
          <Field label="Research activity category" value="Citizen science / image classification" />
          <Field label="Provider evidence type" value="Provider certificate confirmed" />
          <Field label="Provider-recorded minutes" value={String(totalMinutes)} />
          <Field label="colift credited hours" value={`${totalHours}h (ledger: ${ledgerHours}h)`} />
          <Field
            label="colift reviewer"
            value={Array.from(new Set(rows.map((r) => r.reviewerName).filter(Boolean))).join(", ") || "—"}
          />
          <Field
            label="Decision date"
            value={latestReviewedAt ? new Date(latestReviewedAt).toISOString().slice(0, 10) : "—"}
          />
          <Field label="Submission IDs" value={rows.map((r) => r.sub.id).join(", ") || "—"} />
        </div>

        {rows.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-meta">Sessions</h2>
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-meta">
                <tr>
                  <th className="pb-2">Project</th>
                  <th className="pb-2">Reviewed</th>
                  <th className="pb-2 text-right">Minutes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.sub.id} className="border-t border-line">
                    <td className="py-2">
                      {r.projectName}
                      {r.projectSlug && <span className="ml-2 text-xs text-meta">{r.projectSlug}</span>}
                    </td>
                    <td className="py-2">
                      {r.sub.reviewed_at ? new Date(r.sub.reviewed_at).toISOString().slice(0, 10) : "—"}
                    </td>
                    <td className="py-2 text-right tabular-nums">{r.review?.credited_minutes ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-meta">Limitations</h2>
          <p className="text-xs leading-relaxed text-body">{ZOONIVERSE_REPORT_DISCLAIMER}</p>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-3">
      <dt className="text-meta">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
