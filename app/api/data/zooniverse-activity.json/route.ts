import { getDb } from "@/lib/cf";
import { rateLimit } from "@/lib/ratelimit";
import { requireDatasetAccess } from "@/lib/dataset-access";
import type { ZooniversePublicActivity } from "@/lib/types";

/**
 * Citizen-science activity dataset, JSON form. Same source rows as the CSV
 * sibling, reads ONLY zooniverse_public_activity. No PII columns exist on
 * that table by construction.
 */

export async function GET(req: Request) {
  const denied = await requireDatasetAccess(req);
  if (denied) return denied;

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "anon";
  const rl = await rateLimit(`zooniverse-json:${ip}`, 5, 60_000).catch(() => ({ ok: true }));
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

  return Response.json(
    {
      schema_version: 1,
      generated_at: new Date().toISOString(),
      license: "CC0-1.0",
      rows: rows.map((r) => ({
        ...r,
        approved_at_iso: new Date(r.approved_at).toISOString(),
      })),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    }
  );
}
