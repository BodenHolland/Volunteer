import { getDb } from "./cf";
import { newId } from "./ids";

export interface AuditEntry {
  actorUserId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  detail?: Record<string, unknown>;
}

/**
 * Persist a server-side error to audit_log so it can be queried later via
 * /api/admin/errors/recent. Never throws — error logging that fails should
 * not cascade into the caller's flow.
 */
export async function logError(
  where: string,
  err: unknown,
  context: Record<string, unknown> = {}
): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack ?? null : null;
  // Mirror to Worker stdout so wrangler tail picks it up too.
  console.error(`[server_error] ${where}: ${message}`, context);
  await writeAudit({
    action: "server_error",
    entityType: "error",
    entityId: where,
    detail: { message, stack, context },
  });
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
