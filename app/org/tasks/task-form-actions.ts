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
  const status = fd.get("status") === "active" ? "active" : "draft";

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
         est_hours, max_hours, location_kind, status, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
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
      data.status,
      Date.now()
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

  await db
    .prepare(
      `UPDATE task_templates SET
        title = ?, category = ?, short_description = ?, instructions_md = ?,
        checklist_json = ?, deliverable_spec_json = ?, validation_rubric_md = ?,
        est_hours = ?, max_hours = ?, location_kind = ?, status = ?
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
      data.status,
      id
    )
    .run();

  revalidatePath("/org/tasks");
  redirect("/org/tasks");
}
