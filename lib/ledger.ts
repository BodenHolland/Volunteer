/**
 * Single source of truth for writing credited hours into `hours_ledger`.
 *
 * Every credit site (org approval, food-audit pipeline + admin spot-approve,
 * gov-audit approval, external-certificate auto-approve) MUST go through here so
 * the write is the SAME atomic upsert everywhere. The race-prone
 * read-modify-write pattern (SELECT total_hours → add → UPDATE) is gone: two
 * concurrent credits into the same (user, month, org) row can no longer clobber
 * each other, because the increment happens inside SQLite via
 * `ON CONFLICT … DO UPDATE SET total_hours = total_hours + excluded.total_hours`.
 *
 * `hours_ledger` has `UNIQUE (user_id, month, certified_org_id)` (0001_init.sql),
 * which is what the ON CONFLICT target binds to.
 */

import { newId } from "./ids";
import { currentMonth } from "./time";

export interface CreditHoursInput {
  userId: string;
  hours: number;
  /** "YYYY-MM"; defaults to the current UTC month. */
  month?: string;
  certifiedOrgId: string;
  /** Optional fixed id (e.g. seed idempotency). Defaults to a fresh `ledger_…` id. */
  id?: string;
}

/**
 * Build the atomic upsert statement for crediting hours. Returns a prepared,
 * bound `D1PreparedStatement` so callers can drop it straight into a
 * `db.batch([...])` alongside the irreversible status flip — guaranteeing the
 * approve and the credit commit together or not at all.
 */
export function creditHoursStmt(
  db: D1Database,
  { userId, hours, month, certifiedOrgId, id }: CreditHoursInput
): D1PreparedStatement {
  return db
    .prepare(
      "INSERT INTO hours_ledger (id, user_id, month, total_hours, certified_org_id) VALUES (?,?,?,?,?) " +
        "ON CONFLICT(user_id, month, certified_org_id) DO UPDATE SET total_hours = total_hours + excluded.total_hours"
    )
    .bind(id ?? newId("ledger"), userId, month ?? currentMonth(), hours, certifiedOrgId);
}

/**
 * Convenience for non-batch callers: awaits the upsert immediately.
 * Prefer `creditHoursStmt` inside a `db.batch(...)` when the credit must be
 * atomic with other writes (e.g. the `status='approved'` flip).
 */
export async function creditHoursToLedger(db: D1Database, input: CreditHoursInput): Promise<void> {
  await creditHoursStmt(db, input).run();
}

export interface CreditedHoursInput {
  /** Volunteer's measured active engagement, in seconds (idle-aware). */
  measuredSeconds: number;
  /** Hours the reviewer requested to credit (defaults to the ceiling when unset). */
  requestedHours?: number;
  /** Calibrated per-task cap. */
  maxHours: number;
}

/**
 * The "real money" math, hoisted out of the org approve path so it can be
 * unit-tested in isolation.
 *
 * Change 4 / hard line #1: credited hours are the volunteer's MEASURED ACTIVE
 * engagement, capped at the calibrated cap. The reviewer may only REDUCE for
 * quality, never credit above measured time; the task estimate is never the
 * source. So: ceiling = min(measured, maxHours), credited = clamp(requested, 0, ceiling).
 * When `requestedHours` is omitted the volunteer is credited the full ceiling.
 */
export function computeCreditedHours({
  measuredSeconds,
  requestedHours,
  maxHours,
}: CreditedHoursInput): { credited: number; measuredHours: number; ceiling: number } {
  const measuredHours = (measuredSeconds ?? 0) / 3600;
  const ceiling = Math.min(measuredHours, maxHours);
  const requested = requestedHours ?? ceiling;
  const credited = Math.max(0, Math.min(requested, ceiling));
  return { credited, measuredHours, ceiling };
}
