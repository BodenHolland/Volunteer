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

  // Lazy fallback: if the waitUntil from submit dropped or never fired, re-arm
  // the pipeline in the background. This is safe to fire from every poll —
  // processAudit() makes an atomic single-flight claim (UPDATE … WHERE
  // validation_status = 'submitted', proceed only when changes === 1), so two
  // concurrent polls (or a poll racing the submit-time waitUntil) can never both
  // process or double-credit. A row already in 'validating' fails the claim and
  // the re-kicked run no-ops, leaving it to whichever run claimed it.
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
