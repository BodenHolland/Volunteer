import { NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { getCurrentUser } from "@/lib/session";
import { writeAudit } from "@/lib/audit";

/**
 * Cap-calibration methodology (Change 5). For each active task, derive the cap
 * from the *observed median of real, quality-passing (approved) sessions* 
 * never an uncaught AI guess. Records `cap_calibrated_at` + `cap_sample_size`,
 * and (only with a meaningful sample) tightens `max_hours` toward the median.
 * Run on a schedule (quarterly). Admin-only. The written methodology + this audit
 * trail are the audit defense.
 */
const MIN_SAMPLE = 5; // don't move a cap on a tiny sample

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "admin required" }, { status: 403 });
  }
  const db = getDb();
  const tasks = (await db.prepare("SELECT id, est_hours, max_hours FROM task_templates").all<{ id: string; est_hours: number; max_hours: number }>()).results ?? [];
  const now = Date.now();
  const results: { task_id: string; sample: number; median_hours: number | null; cap: number }[] = [];

  for (const t of tasks) {
    const rows = (await db
      .prepare("SELECT measured_active_seconds AS s FROM submissions WHERE task_template_id = ? AND status = 'approved' AND measured_active_seconds > 0")
      .bind(t.id)
      .all<{ s: number }>()).results ?? [];
    const hours = rows.map((r) => r.s / 3600);
    const sample = hours.length;
    const med = sample > 0 ? median(hours) : null;

    let cap = t.max_hours;
    if (med != null && sample >= MIN_SAMPLE) {
      // Calibrate the cap to the median, rounded up to the nearest 0.5h, but never
      // below the estimate. (Tightening a too-loose cap; never inflating.)
      cap = Math.max(t.est_hours, Math.ceil(med * 2) / 2);
      await db.prepare("UPDATE task_templates SET max_hours = ?, cap_calibrated_at = ?, cap_sample_size = ? WHERE id = ?").bind(cap, now, sample, t.id).run();
    } else {
      await db.prepare("UPDATE task_templates SET cap_calibrated_at = ?, cap_sample_size = ? WHERE id = ?").bind(now, sample, t.id).run();
    }
    results.push({ task_id: t.id, sample, median_hours: med, cap });
  }

  await writeAudit({ actorUserId: user.id, action: "caps_calibrated", detail: { tasks: results.length, min_sample: MIN_SAMPLE } });
  return NextResponse.json({ ok: true, calibrated: results });
}
