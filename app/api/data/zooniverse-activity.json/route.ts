import { getDb } from "@/lib/cf";
import { rateLimit } from "@/lib/ratelimit";
import { requireDatasetAccess } from "@/lib/dataset-access";
import type { ZooniversePublicActivity } from "@/lib/types";

/**
 * Citizen-science activity dataset, JSON form. Same source rows as the CSV
 * sibling — reads ONLY zooniverse_public_activity. No PII columns exist on
 * that table by construction.
 *
 * M1 — Streaming + keyset pagination: the `rows` array is streamed
 * page-by-page so memory stays bounded regardless of row count. The
 * { schema_version, generated_at, license, rows: [...] } envelope is preserved:
 * the prefix/suffix are emitted around the streamed array. zooniverse_public_-
 * activity has no surrogate `id`; its PRIMARY KEY is public_session_ref (TEXT),
 * so the keyset cursor walks on that column.
 */

const PAGE_SIZE = 1000;

export async function GET(req: Request) {
  // M14 — auth gate retained (signed-in only, deliberate product decision);
  // payload carries no PII (CC0 public-cluster data) and is CDN-cacheable below.
  const denied = await requireDatasetAccess(req);
  if (denied) return denied;

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "anon";
  const rl = await rateLimit(`zooniverse-json:${ip}`, 5, 60_000).catch(() => ({ ok: true }));
  if (!rl.ok) return new Response("rate limited", { status: 429 });

  const db = getDb();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const prefix =
        `{"schema_version":1,` +
        `"generated_at":${JSON.stringify(new Date().toISOString())},` +
        `"license":"CC0-1.0","rows":[`;
      controller.enqueue(encoder.encode(prefix));
      let cursor = "";
      let first = true;
      for (;;) {
        const page =
          (
            await db
              .prepare(
                `SELECT public_session_ref, external_project_id, external_project_slug,
                        task_type_label, reporting_month, credited_minutes,
                        evidence_tier, approved_at
                   FROM zooniverse_public_activity
                   WHERE public_session_ref > ?
                   ORDER BY public_session_ref ASC
                   LIMIT ?`
              )
              .bind(cursor, PAGE_SIZE)
              .all<ZooniversePublicActivity>()
          ).results ?? [];
        if (page.length === 0) break;
        let chunk = "";
        for (const r of page) {
          const shaped = { ...r, approved_at_iso: new Date(r.approved_at).toISOString() };
          chunk += (first ? "" : ",") + JSON.stringify(shaped);
          first = false;
        }
        controller.enqueue(encoder.encode(chunk));
        cursor = page[page.length - 1].public_session_ref;
        if (page.length < PAGE_SIZE) break;
      }
      controller.enqueue(encoder.encode("]}"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // M14 — Public-cluster CC0 data (no PII) — cacheable at the CDN. The
      // requireDatasetAccess gate above forces a per-user response today, so CDN
      // caching only fully takes effect once/if that gate is removed.
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
