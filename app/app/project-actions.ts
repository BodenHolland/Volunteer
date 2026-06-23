"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";
import { getCurrentUser } from "@/lib/session";
import { parseJson, type TimeLogSession, type ChecklistProgress, type Submission } from "@/lib/types";

async function loadOwned(submissionId: string): Promise<Submission | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const s = await getDb().prepare("SELECT * FROM submissions WHERE id = ?").bind(submissionId).first<Submission>();
  if (!s || s.user_id !== user.id) return null;
  return s;
}

export async function commitToTask(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/start");
  const taskId = String(formData.get("task_id") ?? "");
  const task = await getDb()
    .prepare("SELECT id, category, deliverable_spec_json, short_description FROM task_templates WHERE id = ?")
    .bind(taskId)
    .first<{ id: string; category: string; deliverable_spec_json: string; short_description: string }>();
  if (!task) redirect("/app/tasks");

  const db = getDb();

  // Resume an existing unfinished draft for this task instead of spawning a
  // duplicate every time "Commit" is clicked. A *new* instance is created only
  // once the prior one is submitted — doing the task again (e.g. auditing a
  // different store) is intentional, accumulating empty drafts is not.
  if (task.category === "food-audit") {
    const draft = await db
      .prepare(
        `SELECT a.id FROM audits a
         JOIN submissions s ON s.id = a.submission_id
         WHERE a.user_id = ? AND s.task_template_id = ? AND a.submitted_at IS NULL
         ORDER BY a.started_at DESC LIMIT 1`
      )
      .bind(user.id, taskId)
      .first<{ id: string }>();
    if (draft) redirect(`/app/audits/${draft.id}`);
  } else if (task.category === "gov-audit") {
    const draft = await db
      .prepare(
        `SELECT id FROM gov_audit_sessions
         WHERE user_id = ? AND task_template_id = ? AND status = 'in_progress'
         ORDER BY started_at DESC LIMIT 1`
      )
      .bind(user.id, taskId)
      .first<{ id: string }>();
    if (draft) redirect(`/app/gov-audits/${draft.id}`);
  } else {
    const draft = await db
      .prepare(
        `SELECT id FROM submissions
         WHERE user_id = ? AND task_template_id = ? AND status IN ('committed','in_progress')
         ORDER BY committed_at DESC LIMIT 1`
      )
      .bind(user.id, taskId)
      .first<{ id: string }>();
    if (draft) redirect(`/app/projects/${draft.id}`);
  }

  const id = newId("sub");
  const now = Date.now();
  await db
    .prepare(
      "INSERT INTO submissions (id, user_id, task_template_id, status, committed_at, time_log_json, checklist_progress_json) VALUES (?,?,?,?,?,?,?)"
    )
    .bind(id, user.id, taskId, "committed", now, "[]", "{}")
    .run();

  if (task.category === "food-audit") {
    const { BASKET_TEMPLATE_ID, BASKET_TEMPLATE_VERSION } = await import("@/lib/food-audit");
    const auditId = newId("aud");
    await db
      .prepare(
        `INSERT INTO audits (id, submission_id, user_id, basket_template_id, basket_template_version, started_at)
         VALUES (?,?,?,?,?,?)`
      )
      .bind(auditId, id, user.id, BASKET_TEMPLATE_ID, BASKET_TEMPLATE_VERSION, now)
      .run();
    redirect(`/app/audits/${auditId}`);
  }

  if (task.category === "gov-audit") {
    const { classifyDevice } = await import("@/lib/gov-audit");
    const { parseJson } = await import("@/lib/types");
    const { headers } = await import("next/headers");
    const ua = (await headers()).get("user-agent");
    const spec = parseJson<{ target_descriptor?: string }>(task.deliverable_spec_json, {});
    const generic = spec.target_descriptor ?? task.short_description;
    // If we know the user's city, point the task at their city specifically —
    // local government, nonprofit, and public-service sites are the audit
    // surface most likely to be neglected and most useful to publish on.
    const target = user.city
      ? `Audit ${user.city}'s government, nonprofit, or public-service websites`
      : generic;
    const sessionId = newId("gaudit");
    await db
      .prepare(
        `INSERT INTO gov_audit_sessions
         (id, user_id, submission_id, task_template_id, device, public_session_ref, status, started_at, target_descriptor)
         VALUES (?,?,?,?,?,?, 'in_progress', ?, ?)`
      )
      .bind(sessionId, user.id, id, taskId, classifyDevice(ua), crypto.randomUUID(), now, target)
      .run();
    redirect(`/app/gov-audits/${sessionId}`);
  }
  redirect(`/app/projects/${id}`);
}

export async function startSession(formData: FormData) {
  const id = String(formData.get("submission_id") ?? "");
  const s = await loadOwned(id);
  if (!s) return;
  const log = parseJson<TimeLogSession[]>(s.time_log_json, []);
  if (log.some((x) => x.end === null)) {
    // already running
    revalidatePath(`/app/projects/${id}`);
    return;
  }
  const now = Date.now();
  log.push({ start: now, end: null });
  const first = s.first_started_at ?? now;
  await getDb()
    .prepare("UPDATE submissions SET time_log_json = ?, first_started_at = ?, status = ? WHERE id = ?")
    .bind(JSON.stringify(log), first, s.status === "committed" ? "in_progress" : s.status, id)
    .run();
  revalidatePath(`/app/projects/${id}`);
}

export async function stopSession(formData: FormData) {
  const id = String(formData.get("submission_id") ?? "");
  const s = await loadOwned(id);
  if (!s) return;
  const log = parseJson<TimeLogSession[]>(s.time_log_json, []);
  const open = [...log].reverse().find((x) => x.end === null);
  if (open) open.end = Date.now();

  // Hours integrity: accumulate the client-measured *active* and idle seconds for
  // this session. Active time is the credit basis (never wall-clock or estimate).
  const active = Math.max(0, Math.floor(Number(formData.get("active_seconds") ?? 0)));
  const idle = Math.max(0, Math.floor(Number(formData.get("idle_seconds") ?? 0)));
  const db = getDb();
  const cur = await db
    .prepare("SELECT measured_active_seconds, idle_seconds FROM submissions WHERE id = ?")
    .bind(id)
    .first<{ measured_active_seconds: number; idle_seconds: number }>();
  // Defensively cap active time at wall-clock elapsed for this session.
  const wallSec = open && open.end ? Math.round((open.end - open.start) / 1000) : active;
  const activeCapped = Math.min(active, Math.max(wallSec, 0));
  await db
    .prepare(
      "UPDATE submissions SET time_log_json = ?, measured_active_seconds = ?, idle_seconds = ? WHERE id = ?"
    )
    .bind(
      JSON.stringify(log),
      (cur?.measured_active_seconds ?? 0) + activeCapped,
      (cur?.idle_seconds ?? 0) + idle,
      id
    )
    .run();
  revalidatePath(`/app/projects/${id}`);
}

export async function toggleChecklist(formData: FormData) {
  const id = String(formData.get("submission_id") ?? "");
  const itemId = String(formData.get("item_id") ?? "");
  const checked = formData.get("checked") === "1";
  const s = await loadOwned(id);
  if (!s) return;
  const prog = parseJson<ChecklistProgress>(s.checklist_progress_json, {});
  prog[itemId] = checked;
  await getDb().prepare("UPDATE submissions SET checklist_progress_json = ? WHERE id = ?").bind(JSON.stringify(prog), id).run();
  revalidatePath(`/app/projects/${id}`);
}

export async function saveNotes(formData: FormData) {
  const id = String(formData.get("submission_id") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const s = await loadOwned(id);
  if (!s) return;
  await getDb().prepare("UPDATE submissions SET user_notes = ? WHERE id = ?").bind(notes, id).run();
  revalidatePath(`/app/projects/${id}`);
}
