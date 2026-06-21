import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/cf";
import { requireUser } from "@/lib/session";
import { processAudit } from "@/lib/audit-pipeline";


export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireUser();
  const row = await getDb()
    .prepare("SELECT validation_status, credited_hours, user_id FROM audits WHERE id = ?")
    .bind(id)
    .first<{ validation_status: string; credited_hours: number | null; user_id: string }>();
  if (!row || row.user_id !== user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Lazy fallback: if the waitUntil from submit dropped or never fired, kick the pipeline.
  if (row.validation_status === "submitted" || row.validation_status === "validating") {
    try {
      getCloudflareContext().ctx.waitUntil(processAudit(id));
    } catch {
      /* not in Workers runtime */
    }
  }

  return NextResponse.json({
    validation_status: row.validation_status,
    credited_hours: row.credited_hours,
  });
}
