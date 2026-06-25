import { getDb } from "@/lib/cf";
import { csvEscape } from "@/lib/audit-aggregate";
import { rateLimit } from "@/lib/ratelimit";
import { requireDatasetAccess } from "@/lib/dataset-access";
import type { ZooniversePublicActivity } from "@/lib/types";

/**
 * Citizen-science activity dataset (Zooniverse-verified).
 *
 * DATA PRINCIPLE: reads ONLY zooniverse_public_activity. That table has no
 * FK to users or submissions — the only link is an opaque public_session_ref
 * the requester cannot dereference. The export is safe by construction
 * because the public table simply does not have PII columns to leak.
 *
 * See migration 0019_zooniverse.sql and docs/prd-zooniverse-verification.md §10.
 */

export async function GET(req: Request) {
  const denied = await requireDatasetAccess(req);
  if (denied) return denied;

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "anon";
  const rl = await rateLimit(`zooniverse-csv:${ip}`, 5, 60_000).catch(() => ({ ok: true }));
  if (!rl.ok) return new Response("rate limited", { status: 429 });

  const rows =
    (
      await getDb()
        .prepare(
          `SELECT public_session_ref, external_project_id, external_project_slug,
                  task_type_label, reporting_month, credited_minutes,
                  evidence_tier, approved_at
             FROM zooniverse_public_activity
             ORDER BY reporting_month DESC, approved_at DESC`
        )
        .all<ZooniversePublicActivity>()
    ).results ?? [];

  const header = [
    "public_session_ref",
    "external_project_id",
    "external_project_slug",
    "task_type_label",
    "reporting_month",
    "credited_minutes",
    "evidence_tier",
    "approved_at_iso",
  ].join(",");

  const lines = rows.map((r) =>
    [
      csvEscape(r.public_session_ref),
      csvEscape(r.external_project_id),
      csvEscape(r.external_project_slug),
      csvEscape(r.task_type_label),
      csvEscape(r.reporting_month),
      String(r.credited_minutes),
      csvEscape(r.evidence_tier),
      csvEscape(new Date(r.approved_at).toISOString()),
    ].join(",")
  );

  return new Response([header, ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=zooniverse-activity.csv",
      "Cache-Control": "public, max-age=300",
    },
  });
}
