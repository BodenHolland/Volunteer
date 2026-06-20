"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";
import { requireOrgAdmin } from "@/lib/session";
import { parseJson, type ChecklistItem, type DeliverableSpec, type TaskCategory, type LocationKind, type TaskTemplate } from "@/lib/types";

const CATEGORIES: TaskCategory[] = [
  "data-collection",
  "translation",
  "civic-input",
  "neighborhood-writing",
  "seminar",
];
const LOCATIONS: LocationKind[] = ["online", "in_person", "hybrid"];

interface ParsedForm {
  title: string;
  category: TaskCategory;
  short_description: string;
  instructions_md: string;
  checklist_json: string;
  deliverable_spec_json: string;
  validation_rubric_md: string;
  est_hours: number;
  max_hours: number;
  location_kind: LocationKind;
  status: "draft" | "active";
  gate_external_beneficiary: number;
  gate_genuine_need: number;
  gate_free_deliverable: number;
  gate_would_do_anyway: number;
}

/** Validates + normalizes the task form payload. Throws on missing required text. */
function parseForm(fd: FormData): ParsedForm {
  const title = String(fd.get("title") ?? "").trim();
  const short_description = String(fd.get("short_description") ?? "").trim();
  const instructions_md = String(fd.get("instructions_md") ?? "").trim();
  if (!title || !short_description || !instructions_md) {
    throw new Error("Title, short description, and instructions are required.");
  }

  const category = (CATEGORIES.includes(fd.get("category") as TaskCategory)
    ? (fd.get("category") as TaskCategory)
    : "data-collection");
  const location_kind = (LOCATIONS.includes(fd.get("location_kind") as LocationKind)
    ? (fd.get("location_kind") as LocationKind)
    : "online");
  const requestedActive = fd.get("status") === "active";

  // 4-part beneficiary gate.
  const gate_external_beneficiary = fd.get("gate_external_beneficiary") === "1" ? 1 : 0;
  const gate_genuine_need = fd.get("gate_genuine_need") === "1" ? 1 : 0;
  const gate_free_deliverable = fd.get("gate_free_deliverable") === "1" ? 1 : 0;
  const gate_would_do_anyway = fd.get("gate_would_do_anyway") === "1" ? 1 : 0;
  const gatePassed =
    gate_external_beneficiary === 1 &&
    gate_genuine_need === 1 &&
    gate_free_deliverable === 1 &&
    gate_would_do_anyway === 1;

  // ENFORCE: a task may only be active if all four gate criteria pass.
  // If not, force it back to draft (admin approval lifts this elsewhere).
  const status: "draft" | "active" = requestedActive && gatePassed ? "active" : "draft";

  // Checklist: default to [] if empty/invalid.
  const checklist = parseJson<ChecklistItem[]>(String(fd.get("checklist_json") ?? "[]"), []).filter(
    (c) => c && typeof c.label === "string" && c.label.trim().length > 0
  );

  // Deliverable spec.
  const minPhotos = Number(fd.get("min_photos"));
  const minWords = Number(fd.get("min_words"));
  const spec: DeliverableSpec = { kind: category };
  if (Number.isFinite(minPhotos) && minPhotos > 0) spec.min_photos = Math.round(minPhotos);
  if (Number.isFinite(minWords) && minWords > 0) spec.min_words = Math.round(minWords);
  if (fd.get("require_geotag") === "1") spec.require_geotag = true;

  const est_hours = Math.max(0, Number(fd.get("est_hours")) || 0);
  const max_hours = Math.max(est_hours, Number(fd.get("max_hours")) || 0);

  return {
    title,
    category,
    short_description,
    instructions_md,
    checklist_json: JSON.stringify(checklist),
    deliverable_spec_json: JSON.stringify(spec),
    validation_rubric_md: String(fd.get("validation_rubric_md") ?? "").trim(),
    est_hours,
    max_hours,
    location_kind,
    status,
    gate_external_beneficiary,
    gate_genuine_need,
    gate_free_deliverable,
    gate_would_do_anyway,
  };
}

export async function createTask(formData: FormData) {
  const user = await requireOrgAdmin();
  if (!user.org_id) redirect("/org");
  const data = parseForm(formData);

  await getDb()
    .prepare(
      `INSERT INTO task_templates
        (id, org_id, created_by_user_id, title, category, short_description, instructions_md,
         checklist_json, deliverable_spec_json, validation_rubric_md,
         est_hours, max_hours, location_kind, status, created_at,
         gate_external_beneficiary, gate_genuine_need, gate_free_deliverable, gate_would_do_anyway)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .bind(
      newId("task"),
      user.org_id,
      user.id,
      data.title,
      data.category,
      data.short_description,
      data.instructions_md,
      data.checklist_json,
      data.deliverable_spec_json,
      data.validation_rubric_md,
      data.est_hours,
      data.max_hours,
      data.location_kind,
      // New tasks always start as draft — only an admin gate-review (see
      // /admin/tasks) may set them active. Org self-attestation isn't enough.
      "draft",
      Date.now(),
      data.gate_external_beneficiary,
      data.gate_genuine_need,
      data.gate_free_deliverable,
      data.gate_would_do_anyway
    )
    .run();

  revalidatePath("/org/tasks");
  redirect("/org/tasks");
}

export async function updateTask(formData: FormData) {
  const user = await requireOrgAdmin();
  if (!user.org_id) redirect("/org");
  const id = String(formData.get("task_id") ?? "");
  const db = getDb();
  const existing = await db.prepare("SELECT * FROM task_templates WHERE id = ?").bind(id).first<TaskTemplate>();
  if (!existing || existing.org_id !== user.org_id) redirect("/unauthorized");

  const data = parseForm(formData);
  // A task may remain/become active only if it was already admin gate-reviewed
  // AND still passes the gate (parseForm gives 'active' only when all four pass).
  const status: "draft" | "active" = existing.gate_reviewed_at && data.status === "active" ? "active" : "draft";

  await db
    .prepare(
      `UPDATE task_templates SET
        title = ?, category = ?, short_description = ?, instructions_md = ?,
        checklist_json = ?, deliverable_spec_json = ?, validation_rubric_md = ?,
        est_hours = ?, max_hours = ?, location_kind = ?, status = ?,
        gate_external_beneficiary = ?, gate_genuine_need = ?,
        gate_free_deliverable = ?, gate_would_do_anyway = ?
       WHERE id = ?`
    )
    .bind(
      data.title,
      data.category,
      data.short_description,
      data.instructions_md,
      data.checklist_json,
      data.deliverable_spec_json,
      data.validation_rubric_md,
      data.est_hours,
      data.max_hours,
      data.location_kind,
      status,
      data.gate_external_beneficiary,
      data.gate_genuine_need,
      data.gate_free_deliverable,
      data.gate_would_do_anyway,
      id
    )
    .run();

  revalidatePath("/org/tasks");
  redirect("/org/tasks");
}
