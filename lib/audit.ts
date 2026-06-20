import { getDb } from "./cf";
import { newId } from "./ids";

export interface AuditEntry {
  actorUserId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  detail?: Record<string, unknown>;
}

/** Append an immutable audit-log row. Never throws into the caller's flow. */
export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    await getDb()
      .prepare(
        "INSERT INTO audit_log (id, actor_user_id, action, entity_type, entity_id, detail_json, created_at) VALUES (?,?,?,?,?,?,?)"
      )
      .bind(
        newId("audit"),
        entry.actorUserId ?? null,
        entry.action,
        entry.entityType ?? null,
        entry.entityId ?? null,
        entry.detail ? JSON.stringify(entry.detail) : null,
        Date.now()
      )
      .run();
  } catch (e) {
    console.error("[audit] failed", entry.action, e);
  }
}
