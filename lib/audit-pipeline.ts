/**
 * Async post-submission validation for food-audit submissions.
 * Fired via waitUntil() from submitAuditAction; idempotent (no-ops unless
 * the audit is still in 'submitted' or 'validating').
 *
 * Steps (per handoff §5.3 async):
 *  1. Vision-validate each in-stock photo
 *  2. OCR cross-check (price stated vs ocr_price_value), tier-aware tolerance
 *  3. EXIF geocode within 100m of store
 *  4. Trust-tier sampling for spot review (otherwise auto-verify)
 *  5. Recompute volunteer_trust
 *  6. Terminal status: verified | flagged | rejected
 */

import { getDb, getEnv, getFiles } from "./cf";
import { newId } from "./ids";
import { validateAuditPhoto, visionPasses, type VisionResult } from "./audit-vision";
import {
  findItem,
  type AuditItemCaptureRow,
  type AuditPhotoRow,
  type AuditRow,
  type Store,
} from "./food-audit";
import { nextTier, rollSample, strictnessForTier, type TrustRow } from "./audit-trust";
import {
  isoDate,
  MAX_RETRY_ATTEMPTS,
  nextRetryDelayMs,
  normalizeUnitPrice,
  OFF_PRODUCT_CODES,
  OPEN_PRICES_PROJECT_TAG,
  postOpenPrice,
} from "./open-prices";

const TERMINAL_STATUSES = new Set(["verified", "flagged", "rejected"]);
const PHOTO_GEO_RADIUS_M = 100;

interface PendingFlag {
  flag_type: string;
  flag_severity: "block" | "review";
  flag_reason: string;
  metadata?: unknown;
}

export async function processAudit(auditId: string): Promise<void> {
  const db = getDb();
  const audit = await db.prepare("SELECT * FROM audits WHERE id = ?").bind(auditId).first<AuditRow>();
  if (!audit) return;
  if (TERMINAL_STATUSES.has(audit.validation_status)) return;

  // Mark as validating (idempotent — only flips submitted → validating)
  await db
    .prepare("UPDATE audits SET validation_status = 'validating' WHERE id = ? AND validation_status = 'submitted'")
    .bind(auditId)
    .run();

  const captures =
    (
      await db
        .prepare("SELECT * FROM audit_item_captures WHERE audit_id = ?")
        .bind(auditId)
        .all<AuditItemCaptureRow>()
    ).results ?? [];

  const photos =
    (
      await db
        .prepare("SELECT * FROM audit_photos WHERE audit_id = ?")
        .bind(auditId)
        .all<AuditPhotoRow>()
    ).results ?? [];
  const photoById = new Map(photos.map((p) => [p.id, p]));

  const store = audit.store_id
    ? await db.prepare("SELECT * FROM stores WHERE id = ?").bind(audit.store_id).first<Store>()
    : null;

  const trust = await getOrInitTrust(audit.user_id);
  const strictness = strictnessForTier(trust.tier);
  const env = getEnv();
  const r2 = getFiles();

  const pendingFlags: PendingFlag[] = [];

  // ---- 1. Vision validation (parallel per in-stock photo) ----
  const visionJobs = captures
    .filter((c) => c.stock_status === "in-stock" && c.photo_id)
    .map(async (cap) => {
      const photo = photoById.get(cap.photo_id!);
      if (!photo) return;
      const item = findItem(cap.basket_item_id);
      if (!item) return;

      let result: VisionResult;
      try {
        const obj = await r2.get(photo.r2_key);
        if (!obj) {
          await db
            .prepare("UPDATE audit_photos SET vision_validation_status = 'skipped' WHERE id = ?")
            .bind(photo.id)
            .run();
          return;
        }
        const buf = await obj.arrayBuffer();
        await db
          .prepare("UPDATE audit_photos SET vision_validation_status = 'running' WHERE id = ?")
          .bind(photo.id)
          .run();
        result = await validateAuditPhoto({
          category: item.category,
          imageMime: obj.httpMetadata?.contentType ?? "image/jpeg",
          imageBase64: toBase64(buf),
          apiKey: env.OPENROUTER_API_KEY,
          model: env.OPENROUTER_MODEL,
          siteUrl: env.OPENROUTER_SITE_URL,
          appName: env.OPENROUTER_APP_NAME,
        });
      } catch {
        await db
          .prepare("UPDATE audit_photos SET vision_validation_status = 'skipped' WHERE id = ?")
          .bind(photo.id)
          .run();
        return;
      }

      const passed = visionPasses(result, item.category);
      const status = passed ? "passed" : "failed";

      await db
        .prepare(
          `UPDATE audit_photos
           SET vision_validation_status = ?, vision_result_json = ?, ocr_price_value = ?
           WHERE id = ?`
        )
        .bind(status, JSON.stringify(result), result.ocr_price_value, photo.id)
        .run();

      if (!passed) {
        if (!result.contains_price_tag || !result.tag_is_readable) {
          pendingFlags.push({
            flag_type: "photo-no-tag",
            flag_severity: "review",
            flag_reason: `${item.display_name}: shelf tag missing or not readable.`,
            metadata: { item_id: cap.basket_item_id, photo_id: photo.id },
          });
        }
        if (!result.contains_item) {
          pendingFlags.push({
            flag_type: "photo-no-item",
            flag_severity: "review",
            flag_reason: `${item.display_name}: item not visible in photo.`,
            metadata: { item_id: cap.basket_item_id, photo_id: photo.id },
          });
        }
        if (
          result.contains_item &&
          result.item_category_observed !== "unknown" &&
          result.item_category_observed !== item.category
        ) {
          pendingFlags.push({
            flag_type: "item-category-mismatch",
            flag_severity: "review",
            flag_reason: `${item.display_name}: photo looks like ${result.item_category_observed}, not ${item.category}.`,
            metadata: { item_id: cap.basket_item_id, photo_id: photo.id },
          });
        }
      }

      // OCR cross-check (tier-aware tolerance)
      if (
        result.ocr_price_value != null &&
        cap.price_usd != null &&
        cap.price_usd > 0
      ) {
        const diff = Math.abs(result.ocr_price_value - cap.price_usd);
        const tol = cap.price_usd * strictness.ocrTolerance;
        if (diff > tol) {
          pendingFlags.push({
            flag_type: "ocr-mismatch",
            flag_severity: "review",
            flag_reason: `${item.display_name}: tag reads $${result.ocr_price_value.toFixed(2)}, you entered $${cap.price_usd.toFixed(2)} (±${(strictness.ocrTolerance * 100).toFixed(0)}% tolerance).`,
            metadata: {
              item_id: cap.basket_item_id,
              ocr: result.ocr_price_value,
              entered: cap.price_usd,
            },
          });
        }
      }

      // EXIF geocode check
      if (
        store &&
        store.geocode_lat != null &&
        store.geocode_lng != null &&
        photo.exif_geocode_lat != null &&
        photo.exif_geocode_lng != null
      ) {
        const distM = haversineMeters(
          { lat: store.geocode_lat, lng: store.geocode_lng },
          { lat: photo.exif_geocode_lat, lng: photo.exif_geocode_lng }
        );
        if (distM > PHOTO_GEO_RADIUS_M) {
          pendingFlags.push({
            flag_type: "geotag-mismatch",
            flag_severity: "review",
            flag_reason: `${item.display_name}: photo GPS is ${Math.round(distM)}m from the store.`,
            metadata: { item_id: cap.basket_item_id, distance_m: Math.round(distM) },
          });
        }
      }
    });

  await Promise.all(visionJobs);

  // ---- 4. Sampling: tier 0 always gets human review; higher tiers chance-flagged ----
  if (pendingFlags.length === 0 && rollSample(strictness.sampleRate)) {
    pendingFlags.push({
      flag_type: "spot-review-sample",
      flag_severity: "review",
      flag_reason: `Random spot-review sample for trust tier ${trust.tier}.`,
    });
  }

  // ---- Persist flags ----
  const now = Date.now();
  for (const f of pendingFlags) {
    await db
      .prepare(
        `INSERT INTO audit_validation_flags
         (id, audit_id, flag_type, flag_severity, flag_reason, flag_metadata_json, created_at, resolution_status)
         VALUES (?,?,?,?,?,?,?, 'open')`
      )
      .bind(
        newId("flag"),
        auditId,
        f.flag_type,
        f.flag_severity,
        f.flag_reason,
        f.metadata ? JSON.stringify(f.metadata) : null,
        now
      )
      .run();
  }

  const totalFlags = audit.validation_flag_count + pendingFlags.length;
  const hasBlocker = pendingFlags.some((f) => f.flag_severity === "block");

  let nextStatus: "verified" | "flagged" | "rejected" = "verified";
  let credited: number | null = null;
  if (hasBlocker) {
    nextStatus = "rejected";
  } else if (totalFlags > 0) {
    nextStatus = "flagged";
  } else {
    nextStatus = "verified";
    const { creditedHoursFromSeconds } = await import("./food-audit");
    credited = creditedHoursFromSeconds(audit.session_time_seconds);
  }

  await db
    .prepare(
      `UPDATE audits
       SET validation_status = ?, validation_flag_count = ?, credited_hours = ?
       WHERE id = ?`
    )
    .bind(nextStatus, totalFlags, credited, auditId)
    .run();

  // Update parent submission
  if (nextStatus === "verified") {
    await db
      .prepare(
        `UPDATE submissions
         SET status = 'approved', reviewer_id = NULL, reviewed_at = ?, hours_credited = ?
         WHERE id = ?`
      )
      .bind(now, credited, audit.submission_id)
      .run();
    if (credited) await addCreditedHoursToLedger(audit.user_id, credited);
  } else if (nextStatus === "rejected") {
    await db
      .prepare(
        `UPDATE submissions SET status = 'rejected', reviewed_at = ?, reviewer_notes = ? WHERE id = ?`
      )
      .bind(now, pendingFlags.map((f) => f.flag_reason).join(" "), audit.submission_id)
      .run();
  }
  // 'flagged' stays in pending_review for human spot-review (already set on submit).

  await recomputeTrust(audit.user_id);
}

async function getOrInitTrust(userId: string): Promise<TrustRow> {
  const db = getDb();
  const existing = await db
    .prepare("SELECT * FROM volunteer_trust WHERE user_id = ?")
    .bind(userId)
    .first<TrustRow>();
  if (existing) return existing;
  const row: TrustRow = {
    user_id: userId,
    tier: 0,
    audits_completed: 0,
    audits_flagged: 0,
    audits_rejected: 0,
    failed_audits_30_day_window: 0,
    last_recalculated_at: Date.now(),
  };
  await db
    .prepare(
      `INSERT INTO volunteer_trust
        (user_id, tier, audits_completed, audits_flagged, audits_rejected, failed_audits_30_day_window, last_recalculated_at)
       VALUES (?,?,?,?,?,?,?)`
    )
    .bind(row.user_id, row.tier, 0, 0, 0, 0, row.last_recalculated_at)
    .run();
  return row;
}

export async function recomputeTrust(userId: string, nowMs: number = Date.now()): Promise<TrustRow> {
  const db = getDb();
  const trust = await getOrInitTrust(userId);

  const completedRow = await db
    .prepare(`SELECT COUNT(*) AS n FROM audits WHERE user_id = ? AND validation_status = 'verified'`)
    .bind(userId)
    .first<{ n: number }>();
  const flaggedRow = await db
    .prepare(`SELECT COUNT(*) AS n FROM audits WHERE user_id = ? AND validation_status = 'flagged'`)
    .bind(userId)
    .first<{ n: number }>();
  const rejectedRow = await db
    .prepare(`SELECT COUNT(*) AS n FROM audits WHERE user_id = ? AND validation_status = 'rejected'`)
    .bind(userId)
    .first<{ n: number }>();

  const since30 = nowMs - 30 * 24 * 60 * 60 * 1000;
  const failedRow = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM audits
       WHERE user_id = ? AND submitted_at >= ?
         AND validation_status IN ('rejected')`
    )
    .bind(userId, since30)
    .first<{ n: number }>();

  const completed = completedRow?.n ?? 0;
  const flagged = flaggedRow?.n ?? 0;
  const rejected = rejectedRow?.n ?? 0;
  const failed30 = failedRow?.n ?? 0;

  // tier-1 tenure approximation: count audits while at tier 0 vs tier 1.
  // We don't store tier history per audit, so use: if completed >= 30 and failed30 == 0,
  // assume sufficient tenure (acceptable for Slice 2; revisit when adding tier audit log).
  const tier1HeldDays = trust.tier >= 1 ? Math.max(0, (nowMs - trust.last_recalculated_at) / (24 * 60 * 60 * 1000)) : 0;

  const newTier = nextTier({
    prevTier: trust.tier,
    auditsCompleted: completed,
    failedLast30Days: failed30,
    tier1HeldDays: completed >= 30 ? 30 : tier1HeldDays,
  });

  await db
    .prepare(
      `UPDATE volunteer_trust
       SET tier = ?, audits_completed = ?, audits_flagged = ?, audits_rejected = ?,
           failed_audits_30_day_window = ?, last_recalculated_at = ?
       WHERE user_id = ?`
    )
    .bind(newTier, completed, flagged, rejected, failed30, nowMs, userId)
    .run();

  return {
    ...trust,
    tier: newTier,
    audits_completed: completed,
    audits_flagged: flagged,
    audits_rejected: rejected,
    failed_audits_30_day_window: failed30,
    last_recalculated_at: nowMs,
  };
}

async function addCreditedHoursToLedger(userId: string, hours: number, certOrg = "org_food_access"): Promise<void> {
  const db = getDb();
  const now = Date.now();
  const d = new Date(now);
  const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const existing = await db
    .prepare(`SELECT id, total_hours FROM hours_ledger WHERE user_id = ? AND month = ? AND certified_org_id = ?`)
    .bind(userId, ym, certOrg)
    .first<{ id: string; total_hours: number }>();
  if (existing) {
    await db
      .prepare(`UPDATE hours_ledger SET total_hours = ? WHERE id = ?`)
      .bind(existing.total_hours + hours, existing.id)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO hours_ledger (id, user_id, month, total_hours, certified_org_id) VALUES (?,?,?,?,?)`
      )
      .bind(newId("ledger"), userId, ym, hours, certOrg)
      .run();
  }
}

// ---- pure helpers ----

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}
