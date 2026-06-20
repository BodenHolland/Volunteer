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
  const task = await getDb().prepare("SELECT id FROM task_templates WHERE id = ?").bind(taskId).first();
  if (!task) redirect("/app/tasks");

  const id = newId("sub");
  await getDb()
    .prepare(
      "INSERT INTO submissions (id, user_id, task_template_id, status, committed_at, time_log_json, checklist_progress_json) VALUES (?,?,?,?,?,?,?)"
    )
    .bind(id, user.id, taskId, "committed", Date.now(), "[]", "{}")
    .run();
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
  await getDb().prepare("UPDATE submissions SET time_log_json = ? WHERE id = ?").bind(JSON.stringify(log), id).run();
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
