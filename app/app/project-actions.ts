"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";
import { getCurrentUser } from "@/lib/session";
import { getCommittableTask } from "@/lib/queries";
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
  // Only recipients do volunteer work. Server actions are directly POST-invocable,
  // so the /app layout's requireRecipient() guard alone isn't enough — block an
  // org_member/admin from becoming a submission owner, which would otherwise let
  // them later approve and self-credit their own hours onto the CF 888.
  if (user.role !== "recipient") redirect("/unauthorized");
  const taskId = String(formData.get("task_id") ?? "");
  const task = await getDb()
    .prepare("SELECT id, category, deliverable_spec_json, short_description FROM task_templates WHERE id = ?")
    .bind(taskId)
    .first<{ id: string; category: string; deliverable_spec_json: string; short_description: string }>();
  if (!task) redirect("/opportunities");

  // TASK-LIFECYCLE GUARD (H11): a task id is attacker-supplied form data. Refuse
  // to commit unless the task is currently committable — 'active' status, before
  // its closes_at deadline, and a native (full-pipeline) listing rather than a
  // directory-only external listing that links out to the org's own signup.
  // This stops committing to paused/archived/draft/closed/external tasks by
  // POSTing a stale or guessed task_id. Single authoritative check in queries.ts.
  if (!(await getCommittableTask(taskId))) redirect("/opportunities");

  const db = getDb();

  // Resume an existing unfinished draft for this task instead of spawning a
  // duplicate every time "Commit" is clicked. A *new* instance is created only
  // once the prior one is submitted, doing the task again (e.g. auditing a
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
  } else if (task.category === "citizen-science") {
    const draft = await db
      .prepare(
        `SELECT id FROM submissions
         WHERE user_id = ? AND task_template_id = ?
           AND status IN ('committed','in_progress','needs_changes')
         ORDER BY committed_at DESC LIMIT 1`
      )
      .bind(user.id, taskId)
      .first<{ id: string }>();
    if (draft) redirect(`/app/external/${draft.id}`);
  } else {
    const draft = await db
      .prepare(
        `SELECT id FROM submissions
         WHERE user_id = ? AND task_template_id = ? AND status IN ('committed','in_progress')
         ORDER BY committed_at DESC LIMIT 1`
      )
      .bind(user.id, taskId)
      .first<{ id: string }>();
    if (draft) {
      redirect(
        task.category === "ems-rate-research"
          ? `/app/projects/${draft.id}/submit`
          : `/app/projects/${draft.id}`
      );
    }
  }

  const id = newId("sub");
  const now = Date.now();

  // For ems-rate-research, assign the volunteer a provider/city at commit
  // time. Two guarantees:
  //   1. They never get a provider they've already worked on (excluded from the
  //      pool based on prior submissions on this task for this user).
  //   2. The remaining pool is distributed round-robin by global submission
  //      count to avoid two concurrent volunteers grabbing the same target.
  // Also generates the opaque public_session_ref UUID that ties this private
  // submission to its public ems_rate_reports row created at submit time.
  let initialNotes: string | null = null;
  if (task.category === "ems-rate-research") {
    const spec = parseJson<{ ems_targets?: { provider_name: string; city: string; state: string }[] }>(
      task.deliverable_spec_json,
      {}
    );
    const targets = spec.ems_targets ?? [];
    if (targets.length > 0) {
      const priorRows = (
        await db
          .prepare(
            `SELECT user_notes FROM submissions
             WHERE user_id = ? AND task_template_id = ? AND user_notes IS NOT NULL`
          )
          .bind(user.id, taskId)
          .all<{ user_notes: string }>()
      ).results ?? [];
      const usedProviders = new Set(
        priorRows
          .map((r) => parseJson<{ assignment?: { provider_name?: string } }>(r.user_notes, {}).assignment?.provider_name)
          .filter((p): p is string => !!p)
      );
      const remaining = targets.filter((t) => !usedProviders.has(t.provider_name));
      // If the user has exhausted every provider in the pool, fall back to the
      // full pool, they can repeat the oldest assignment. Better than failing
      // the commit and trapping the user.
      const pool = remaining.length > 0 ? remaining : targets;

      const idx = Math.floor(Math.random() * pool.length);
      const assignment = pool[idx];
      initialNotes = JSON.stringify({
        assignment,
        public_session_ref: crypto.randomUUID(),
        bls: { amount: "", source_url: "", not_found: false },
        als: { amount: "", source_url: "", not_found: false },
        mileage: { amount: "", source_url: "", not_found: false },
        tnt: { amount: "", source_url: "", not_found: false },
        tnt_description: "",
        effective_date: "",
        zip_codes: "",
        notes: "",
      });
    }
  }

  await db
    .prepare(
      "INSERT INTO submissions (id, user_id, task_template_id, status, committed_at, time_log_json, checklist_progress_json, user_notes) VALUES (?,?,?,?,?,?,?,?)"
    )
    .bind(id, user.id, taskId, "committed", now, "[]", "{}", initialNotes)
    .run();

  if (task.category === "food-audit") {
    const { BASKET_TEMPLATE_ID, BASKET_TEMPLATE_VERSION } = await import("@/lib/food-audit");
    const auditId = newId("aud");
    // Generate the opaque cross-boundary key now so it travels with the audit
    // through the public cluster (audit_item_captures, audit_photos,
    // open_prices_contributions, audit_public_summaries). The private audits
    // row keeps user_id; the public rows only know this ref. See migration 0016.
    const publicSessionRef = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO audits (id, submission_id, user_id, basket_template_id, basket_template_version, started_at, public_session_ref)
         VALUES (?,?,?,?,?,?,?)`
      )
      .bind(auditId, id, user.id, BASKET_TEMPLATE_ID, BASKET_TEMPLATE_VERSION, now, publicSessionRef)
      .run();
    redirect(`/app/audits/${auditId}`);
  }

  if (task.category === "ems-rate-research") {
    // The structured form is the work, there's no checklist, no time floor,
    // nothing to do on a generic project hub. Jump straight to the form.
    redirect(`/app/projects/${id}/submit`);
  }

  if (task.category === "citizen-science") {
    // External-certificate flow: stamp an opaque public_session_ref on the
    // submission so the future public-cluster row (zooniverse_public_activity)
    // has its cross-boundary key from day one. No project hub, no timer 
    // the work happens off-platform.
    const publicRef = crypto.randomUUID();
    await db
      .prepare("UPDATE submissions SET public_session_ref = ? WHERE id = ?")
      .bind(publicRef, id)
      .run();
    redirect(`/app/external/${id}`);
  }

  if (task.category === "gov-audit") {
    const { classifyDevice } = await import("@/lib/gov-audit");
    const { parseJson } = await import("@/lib/types");
    const { headers } = await import("next/headers");
    const ua = (await headers()).get("user-agent");
    const spec = parseJson<{ target_descriptor?: string }>(task.deliverable_spec_json, {});
    const generic = spec.target_descriptor ?? task.short_description;
    // If we know the user's city, point the task at their city specifically 
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
