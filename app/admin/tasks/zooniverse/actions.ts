"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";
import { requireAdmin } from "@/lib/session";
import { writeAudit } from "@/lib/audit";
import { ORG_CITIZEN_SCIENCE } from "@/lib/zooniverse";

function bounce(error: string): never {
  redirect(`/admin/tasks/zooniverse?error=${encodeURIComponent(error)}`);
}

export async function addZooniverseCatalogEntry(formData: FormData) {
  const admin = await requireAdmin();
  const db = getDb();

  const title = String(formData.get("title") ?? "").trim();
  const shortDesc = String(formData.get("short_description") ?? "").trim();
  const projectId = String(formData.get("external_project_id") ?? "").trim();
  const slug = String(formData.get("external_project_slug") ?? "").trim();
  const url = String(formData.get("project_url") ?? "").trim();
  const taskTypeLabel = String(formData.get("task_type_label") ?? "").trim();
  const capRaw = String(formData.get("monthly_minutes_cap") ?? "").trim();
  const cap: number | null = capRaw === "" ? null : Math.max(0, Number(capRaw));
  const benefit = String(formData.get("public_benefit_summary") ?? "").trim();

  if (!title || !shortDesc || !projectId || !slug || !url || !taskTypeLabel || !benefit) {
    bounce("All fields are required.");
  }
  if (!/^https?:\/\//i.test(url)) bounce("Project URL must start with http:// or https://");

  const gates = {
    eb: formData.get("gate_external_beneficiary") ? 1 : 0,
    gn: formData.get("gate_genuine_need") ? 1 : 0,
    fd: formData.get("gate_free_deliverable") ? 1 : 0,
    wda: formData.get("gate_would_do_anyway") ? 1 : 0,
  };
  const allGates = gates.eb && gates.gn && gates.fd && gates.wda;
  const status = allGates ? "active" : "draft";

  // Ensure the citizen-science reviewer org exists. Lets admins add catalog
  // entries on a fresh deployment without waiting for a full seed.
  const orgExists = await db
    .prepare("SELECT id FROM orgs WHERE id = ?")
    .bind(ORG_CITIZEN_SCIENCE)
    .first<{ id: string }>();
  if (!orgExists) {
    await db
      .prepare(
        `INSERT INTO orgs (id, slug, name, ein, contact_email, logo_url, about_md, address_json,
           signing_authority_name, signing_authority_title, status, is_fictional, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
      )
      .bind(
        ORG_CITIZEN_SCIENCE,
        "colift-citizen-science",
        "colift Citizen Science",
        null,
        "science@colift.org",
        null,
        "Verifies hours volunteers contribute to public-interest research projects on third-party platforms.",
        null,
        "Alex Mercado",
        "Program Director",
        "active",
        0,
        Date.now()
      )
      .run();
  }

  const taskId = newId("task_zoon");
  const now = Date.now();

  await db
    .prepare(
      `INSERT INTO task_templates
         (id, org_id, created_by_user_id, title, category, short_description,
          instructions_md, checklist_json, deliverable_spec_json, validation_rubric_md,
          est_hours, max_hours, location_kind, status, created_at, closes_at, listing_type, external_url,
          external_provider, evidence_mode, monthly_minutes_cap,
          gate_external_beneficiary, gate_genuine_need, gate_free_deliverable, gate_would_do_anyway,
          gate_reviewed_by, gate_reviewed_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .bind(
      taskId,
      ORG_CITIZEN_SCIENCE,
      admin.id,
      title,
      "citizen-science",
      shortDesc,
      `## What you'll do\n\n${shortDesc}\n\nComplete the work on Zooniverse using your own account. When you're done, generate a Volunteer Certificate from your Zooniverse profile for the date range you worked, then return to colift and upload it.`,
      JSON.stringify([
        { id: "account", label: "Sign in to Zooniverse with your own account", required: true },
        { id: "classify", label: "Complete at least one classification session", required: true },
        { id: "certificate", label: "Generate a Volunteer Certificate for the reporting period", required: true },
      ]),
      JSON.stringify({ kind: "citizen-science" }),
      "Reviewer confirms the Zooniverse Volunteer Certificate is legible, in scope, and matches the volunteer; credits the hours Zooniverse reports up to the monthly cap.",
      1,
      cap != null ? Math.max(1, Math.round(cap / 60)) : 999,
      "online",
      status,
      now,
      null,
      "native",
      null,
      "zooniverse",
      "external_certificate",
      cap,
      gates.eb,
      gates.gn,
      gates.fd,
      gates.wda,
      allGates ? admin.id : null,
      allGates ? now : null
    )
    .run();

  await db
    .prepare(
      `INSERT INTO external_project_catalog
         (task_template_id, provider, external_project_id, external_project_slug, project_url,
          allowed_workflow_ids, public_benefit_summary, task_type_label, active, created_at)
       VALUES (?, 'zooniverse', ?, ?, ?, '[]', ?, ?, ?, ?)`
    )
    .bind(taskId, projectId, slug, url, benefit, taskTypeLabel, allGates ? 1 : 0, now)
    .run();

  await writeAudit({
    actorUserId: admin.id,
    action: "zooniverse_catalog_added",
    entityType: "task_template",
    entityId: taskId,
    detail: { slug, gates, status },
  });

  revalidatePath("/admin/tasks/zooniverse");
  redirect(
    `/admin/tasks/zooniverse?ok=${encodeURIComponent(
      allGates ? "Added and activated." : "Added as draft, complete the 4-part gate to activate."
    )}`
  );
}

export async function toggleZooniverseCatalogActive(formData: FormData) {
  const admin = await requireAdmin();
  const db = getDb();
  const taskId = String(formData.get("task_template_id") ?? "");
  const nextActive = String(formData.get("next_active") ?? "0") === "1" ? 1 : 0;

  if (nextActive === 1) {
    // Refuse activation until all four gate flags are checked.
    const gateRow = await db
      .prepare(
        "SELECT gate_external_beneficiary, gate_genuine_need, gate_free_deliverable, gate_would_do_anyway FROM task_templates WHERE id = ?"
      )
      .bind(taskId)
      .first<{
        gate_external_beneficiary: number;
        gate_genuine_need: number;
        gate_free_deliverable: number;
        gate_would_do_anyway: number;
      }>();
    const ok =
      gateRow &&
      gateRow.gate_external_beneficiary &&
      gateRow.gate_genuine_need &&
      gateRow.gate_free_deliverable &&
      gateRow.gate_would_do_anyway;
    if (!ok) bounce("4-part beneficiary gate is incomplete; cannot activate.");
  }

  await db
    .prepare("UPDATE external_project_catalog SET active = ? WHERE task_template_id = ?")
    .bind(nextActive, taskId)
    .run();
  await db
    .prepare("UPDATE task_templates SET status = ? WHERE id = ?")
    .bind(nextActive ? "active" : "paused", taskId)
    .run();

  await writeAudit({
    actorUserId: admin.id,
    action: "zooniverse_catalog_toggled",
    entityType: "task_template",
    entityId: taskId,
    detail: { active: nextActive },
  });

  revalidatePath("/admin/tasks/zooniverse");
  redirect("/admin/tasks/zooniverse?ok=" + encodeURIComponent(nextActive ? "Activated." : "Deactivated."));
}
