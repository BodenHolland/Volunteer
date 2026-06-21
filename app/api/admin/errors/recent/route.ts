import { NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { requireAdmin } from "@/lib/session";

export const runtime = "edge";

interface ErrorRow {
  id: string;
  action: string;
  entity_id: string | null;
  detail_json: string | null;
  actor_user_id: string | null;
  created_at: number;
}

/**
 * Query recent server-side errors logged via logError().
 * Admin-only. Used by the developer to audit prod failures without
 * having to keep `wrangler tail` running.
 *
 * Query params:
 *   limit (default 50, max 500)
 *   since (epoch ms)
 *   where (substring match on entity_id, the call site)
 */
export async function GET(req: Request) {
  await requireAdmin();
  const url = new URL(req.url);
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));
  const since = Number(url.searchParams.get("since") ?? 0);
  const where = url.searchParams.get("where") ?? "";

  const db = getDb();
  let sql = `SELECT id, action, entity_id, detail_json, actor_user_id, created_at
             FROM audit_log
             WHERE action = 'server_error'`;
  const binds: unknown[] = [];
  if (since > 0) {
    sql += " AND created_at >= ?";
    binds.push(since);
  }
  if (where) {
    sql += " AND entity_id LIKE ?";
    binds.push(`%${where}%`);
  }
  sql += " ORDER BY created_at DESC LIMIT ?";
  binds.push(limit);

  const rows = (await db.prepare(sql).bind(...binds).all<ErrorRow>()).results ?? [];

  return NextResponse.json({
    count: rows.length,
    errors: rows.map((r) => ({
      at: new Date(r.created_at).toISOString(),
      where: r.entity_id,
      actor_user_id: r.actor_user_id,
      ...(r.detail_json ? safeParse(r.detail_json) : {}),
    })),
  });
}

function safeParse(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return { detail_raw: s };
  }
}
