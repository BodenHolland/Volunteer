"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/cf";
import { requireAdmin } from "@/lib/session";
import { writeAudit } from "@/lib/audit";
import type { TaskTemplate } from "@/lib/types";

/**
 * Approve a task template against the 4-part beneficiary gate.
 * Only permitted when all four gate booleans are true. Records the reviewing
 * admin + timestamp, allows the template to go active, and writes an audit row.
 */
export async function approveTaskGate(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("task_id") ?? "");
  if (!id) return;

  const db = getDb();
  const task = await db
    .prepare("SELECT * FROM task_templates WHERE id = ?")
    .bind(id)
    .first<TaskTemplate>();
  if (!task) return;

  const gatePassed =
    !!task.gate_external_beneficiary &&
    !!task.gate_genuine_need &&
    !!task.gate_free_deliverable &&
    !!task.gate_would_do_anyway;
  // Guard: never approve a template that is missing gate criteria.
  if (!gatePassed) return;

  await db
    .prepare(
      `UPDATE task_templates
         SET gate_reviewed_by = ?, gate_reviewed_at = ?, status = 'active'
       WHERE id = ?`
    )
    .bind(admin.id, Date.now(), id)
    .run();

  await writeAudit({
    action: "task_gate_approved",
    entityType: "task_template",
    entityId: id,
    actorUserId: admin.id,
  });

  revalidatePath("/admin/tasks");
  revalidatePath("/org/tasks");
}
