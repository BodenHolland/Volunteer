import { NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { requireRecipient } from "@/lib/session";
import { parseNotifyPrefs } from "../notify-prefs";

export const dynamic = "force-dynamic";

/**
 * GET /app/settings/export — downloads the user's account data as JSON.
 * requireRecipient gates access; the file is returned as an attachment.
 */
export async function GET() {
  const user = await requireRecipient();
  const db = getDb();

  // notify_prefs_json isn't on the User type yet (migration 0003); read it directly.
  const prefsRow = await db
    .prepare("SELECT notify_prefs_json FROM users WHERE id = ?")
    .bind(user.id)
    .first<{ notify_prefs_json: string | null }>();

  const submissions =
    (await db
      .prepare(
        `SELECT id, task_template_id, status, committed_at, first_started_at,
                submitted_at, reviewed_at, user_notes, hours_credited
           FROM submissions
          WHERE user_id = ?
          ORDER BY committed_at DESC`
      )
      .bind(user.id)
      .all()).results ?? [];

  const ledger =
    (await db
      .prepare(
        `SELECT id, month, total_hours, certified_org_id
           FROM hours_ledger
          WHERE user_id = ?
          ORDER BY month DESC`
      )
      .bind(user.id)
      .all()).results ?? [];

  const account = {
    id: user.id,
    email: user.email,
    role: user.role,
    intent: user.intent,
    full_name: user.full_name,
    legal_name: user.legal_name,
    case_number: user.case_number,
    address_json: user.address_json,
    dob: user.dob,
    phone: user.phone,
    city: user.city,
    state: user.state,
    created_at: user.created_at,
    email_verified_at: user.email_verified_at,
    notify_prefs: parseNotifyPrefs(prefsRow?.notify_prefs_json),
  };

  const payload = {
    exported_at: new Date().toISOString(),
    account,
    submissions,
    hours_ledger: ledger,
  };

  const body = JSON.stringify(payload, null, 2);
  const filename = `tended-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
