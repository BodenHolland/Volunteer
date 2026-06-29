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
import { creditHoursStmt } from "./ledger";
import { pendingFlagInsertStmts, routePendingFlags, type PendingFlag } from "./pipeline";
import { validateAuditPhoto, visionPasses, type VisionResult } from "./audit-vision";
import { decryptField, encryptJson } from "./crypto";
import { nominatimGeocode, osrmRoute } from "./places";
import { parseJson, type Address } from "./types";
import {
  commuteSecondsForMode,
  creditedHoursFromAuditInputs,
  DEFAULT_TRAVEL_MODE,
  findItem,
  type AuditItemCaptureRow,
  type AuditPhotoRow,
  type AuditRow,
  type Store,
  type TravelMode,
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

// M4: cap how many vision calls run at once. An audit can carry many in-stock
// photos and each vision job is an OpenRouter request + R2 read; firing them all
// via Promise.all fans out unbounded concurrency (rate-limit / OOM / timeout
// risk on the Worker). Run them through a small worker pool instead.
const VISION_CONCURRENCY = 4;

/**
 * Run async task thunks with at most `limit` in flight at a time. Tasks are
 * pulled from a shared cursor by `limit` workers, so each completion frees a
 * slot for the next task. Rejections propagate (mirrors Promise.all), but the
 * vision thunks here already swallow their own failures.
 */
async function runWithConcurrency(tasks: Array<() => Promise<void>>, limit: number): Promise<void> {
  if (tasks.length === 0) return;
  const max = Math.max(1, Math.min(limit, tasks.length));
  let cursor = 0;
  const worker = async (): Promise<void> => {
    while (cursor < tasks.length) {
      const i = cursor++;
      await tasks[i]();
    }
  };
  await Promise.all(Array.from({ length: max }, () => worker()));
}

export async function processAudit(auditId: string): Promise<void> {
  const db = getDb();
  const audit = await db.prepare("SELECT * FROM audits WHERE id = ?").bind(auditId).first<AuditRow>();
  if (!audit) return;
  if (TERMINAL_STATUSES.has(audit.validation_status)) return;

  // Atomic single-flight claim (C4/C5). processAudit is invoked from BOTH the
  // submit action (via waitUntil) AND lazily from the status-poll route, so two
  // runs can race. Gate on the claim's row-count: only the run that actually
  // flips submitted → validating proceeds; every other run bails BEFORE any
  // vision call, flag insert, or ledger credit, so the audit can never be
  // double-credited by a re-run.
  const claim = await db
    .prepare("UPDATE audits SET validation_status = 'validating' WHERE id = ? AND validation_status = 'submitted'")
    .bind(auditId)
    .run();
  if (claim.meta.changes !== 1) return;

  const ref = audit.public_session_ref;

  const captures =
    (
      await db
        .prepare("SELECT * FROM audit_item_captures WHERE public_session_ref = ?")
        .bind(ref)
        .all<AuditItemCaptureRow>()
    ).results ?? [];

  const photos =
    (
      await db
        .prepare("SELECT * FROM audit_photos WHERE public_session_ref = ?")
        .bind(ref)
        .all<AuditPhotoRow>()
    ).results ?? [];
  const photoById = new Map(photos.map((p) => [p.id, p]));

  // EXIF lives in a private side-table (audit_photo_exif) so the public
  // audit_photos export can't accidentally leak camera GPS / capture time.
  // Load it here for the geotag-mismatch fraud check.
  const photoIds = photos.map((p) => p.id);
  const exifByPhotoId = new Map<string, { exif_geocode_lat: number | null; exif_geocode_lng: number | null; exif_timestamp: number | null; device_geocode_lat: number | null; device_geocode_lng: number | null }>();
  if (photoIds.length > 0) {
    const placeholders = photoIds.map(() => "?").join(",");
    const exifRows =
      (
        await db
          .prepare(`SELECT photo_id, exif_geocode_lat, exif_geocode_lng, exif_timestamp, device_geocode_lat, device_geocode_lng FROM audit_photo_exif WHERE photo_id IN (${placeholders})`)
          .bind(...photoIds)
          .all<{ photo_id: string; exif_geocode_lat: number | null; exif_geocode_lng: number | null; exif_timestamp: number | null; device_geocode_lat: number | null; device_geocode_lng: number | null }>()
      ).results ?? [];
    for (const r of exifRows) {
      exifByPhotoId.set(r.photo_id, {
        exif_geocode_lat: r.exif_geocode_lat,
        exif_geocode_lng: r.exif_geocode_lng,
        exif_timestamp: r.exif_timestamp,
        device_geocode_lat: r.device_geocode_lat,
        device_geocode_lng: r.device_geocode_lng,
      });
    }
  }

  const store = audit.store_id
    ? await db.prepare("SELECT * FROM stores WHERE id = ?").bind(audit.store_id).first<Store>()
    : null;

  const trust = await getOrInitTrust(audit.user_id);
  const strictness = strictnessForTier(trust.tier);
  const env = getEnv();
  const r2 = getFiles();

  const pendingFlags: PendingFlag[] = [];

  // ---- 1. Vision validation (bounded-concurrency per in-stock photo, M4) ----
  // Each entry is a lazy thunk so runWithConcurrency controls when it starts;
  // building them with `.map(async …)` would start every call immediately.
  const visionJobs: Array<() => Promise<void>> = captures
    .filter((c) => c.stock_status === "in-stock" && c.photo_id)
    .map((cap) => async () => {
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

      // Proof-of-presence — the photo's EXIF GPS or the device's GPS at capture
      // must place the volunteer at the store. Both live in the private
      // audit_photo_exif side-table; device GPS covers photos with no EXIF
      // location. Flag only when a signal exists AND none of them is near.
      const exif = exifByPhotoId.get(photo.id);
      if (store && store.geocode_lat != null && store.geocode_lng != null && exif) {
        const distM = nearestPresenceMeters(
          { lat: store.geocode_lat, lng: store.geocode_lng },
          [
            { lat: exif.exif_geocode_lat, lng: exif.exif_geocode_lng },
            { lat: exif.device_geocode_lat, lng: exif.device_geocode_lng },
          ]
        );
        if (distM != null && distM > PHOTO_GEO_RADIUS_M) {
          pendingFlags.push({
            flag_type: "geotag-mismatch",
            flag_severity: "review",
            flag_reason: `${item.display_name}: location is ${Math.round(distM)}m from the store.`,
            metadata: { item_id: cap.basket_item_id, distance_m: Math.round(distM) },
          });
        }
      }
    });

  await runWithConcurrency(visionJobs, VISION_CONCURRENCY);

  // ---- 4. Sampling: tier 0 always gets human review; higher tiers chance-flagged ----
  if (pendingFlags.length === 0 && rollSample(strictness.sampleRate)) {
    pendingFlags.push({
      flag_type: "spot-review-sample",
      flag_severity: "review",
      flag_reason: `Random spot-review sample for trust tier ${trust.tier}.`,
    });
  }

  // ---- Persist flags (shared INSERT builder; same rows as before) ----
  const now = Date.now();
  for (const stmt of pendingFlagInsertStmts(db, auditId, pendingFlags, now)) {
    await stmt.run();
  }

  // Shared block/review → terminal-status routing (lib/pipeline.ts).
  const { status: nextStatus, totalFlags } = routePendingFlags(
    pendingFlags,
    audit.validation_flag_count
  );
  let credited: number | null = null;
  if (nextStatus === "verified") {
    credited = await computeCreditedHoursForAudit(auditId);
  }

  // Terminal flip is a COMPARE-AND-SET on the 'validating' state this run
  // claimed at the top — never an unconditional write. The admin spot-approve
  // path (audit-actions.ts) deliberately also claims 'validating' rows (to
  // rescue a crashed pipeline run), so without this guard BOTH paths would
  // credit the SAME (user, month, org_food_access) ledger row when an admin
  // approves an audit the async pipeline is still mid-flight on — doubling the
  // volunteer's hours on the CF 888. If the CAS matches zero rows, another path
  // already finalized this audit; bail BEFORE crediting.
  const flip = await db
    .prepare(
      `UPDATE audits
         SET validation_status = ?, validation_flag_count = ?, credited_hours = ?
       WHERE id = ? AND validation_status = 'validating'`
    )
    .bind(nextStatus, totalFlags, credited, auditId)
    .run();
  if (flip.meta.changes !== 1) return;

  // The dependent terminal writes (parent submission flip, public-summary
  // publish, ledger credit) ride in one db.batch() (D1 implicit transaction)
  // behind the winning flip — the CAS-then-batch pattern every other credit
  // path uses. Only the run that won the flip above reaches the credit.
  const batch: D1PreparedStatement[] = [];

  if (nextStatus === "verified") {
    batch.push(
      db
        .prepare(
          `UPDATE submissions
           SET status = 'approved', reviewer_id = NULL, reviewed_at = ?, hours_credited = ?
           WHERE id = ?`
        )
        .bind(now, credited, audit.submission_id)
    );
    // Flip the public summary to verified so the public export surfaces this row.
    batch.push(
      db
        .prepare("UPDATE audit_public_summaries SET verified_at = ? WHERE public_session_ref = ?")
        .bind(now, ref)
    );
    if (credited) {
      batch.push(creditHoursStmt(db, { userId: audit.user_id, hours: credited, certifiedOrgId: "org_food_access" }));
    }
  } else if (nextStatus === "rejected") {
    batch.push(
      db
        .prepare(
          `UPDATE submissions SET status = 'rejected', reviewed_at = ?, reviewer_notes = ? WHERE id = ?`
        )
        .bind(now, pendingFlags.map((f) => f.flag_reason).join(" "), audit.submission_id)
    );
  }
  // 'flagged' stays in pending_review for human spot-review (already set on submit).

  if (batch.length) await db.batch(batch);

  // Open Prices contribution is a network side-effect (queued on failure) — kept
  // out of the atomic batch so a remote outage can't roll back the approval.
  if (nextStatus === "verified") {
    await contributeAuditToOpenPrices(auditId).catch(() => {
      /* contribution failures are queued, not surfaced */
    });
  }

  await recomputeTrust(audit.user_id);
}

export interface AuditCreditBreakdown {
  itemsDocumented: number;
  /** Round-trip commute seconds actually credited (mode-estimate or user override). */
  oneWayCommuteSeconds: number | null;
  creditedHours: number;
  /** Per-mode one-way commute estimates from the same route, for the UI picker. */
  modeEstimates: Record<TravelMode, number> | null;
  /** User-entered round-trip minutes override, if any. */
  userMinutes: number | null;
}

/**
 * Server-side credit computation for an audit, broken down so the UI can
 * explain *why* a volunteer is getting credited what they are.
 *   credited = 5 min × items_documented + round-trip commute from home → store
 * Each side is capped (see food-audit.ts constants). When the user has no
 * geocoded home address, the store has no coords, or OSRM is down, commute
 * is reported as null and we credit only the documentation time.
 */
export async function previewCreditForAudit(auditId: string): Promise<AuditCreditBreakdown> {
  const db = getDb();
  const audit = await db
    .prepare("SELECT id, user_id, store_id, commute_mode, commute_user_minutes, public_session_ref FROM audits WHERE id = ?")
    .bind(auditId)
    .first<{
      id: string;
      user_id: string;
      store_id: string | null;
      commute_mode: string | null;
      commute_user_minutes: number | null;
      public_session_ref: string;
    }>();
  if (!audit) {
    return {
      itemsDocumented: 0,
      oneWayCommuteSeconds: null,
      creditedHours: 0,
      modeEstimates: null,
      userMinutes: null,
    };
  }

  const itemsRow = await db
    .prepare("SELECT COUNT(*) AS n FROM audit_item_captures WHERE public_session_ref = ?")
    .bind(audit.public_session_ref)
    .first<{ n: number }>();
  const itemsDocumented = itemsRow?.n ?? 0;

  let oneWaySeconds: number | null = null;
  let modeEstimates: Record<TravelMode, number> | null = null;
  const userMinutes = audit.commute_user_minutes ?? null;

  if (audit.store_id) {
    const store = await db
      .prepare("SELECT geocode_lat, geocode_lng FROM stores WHERE id = ?")
      .bind(audit.store_id)
      .first<{ geocode_lat: number | null; geocode_lng: number | null }>();
    const userRow = await db
      .prepare("SELECT address_json FROM users WHERE id = ?")
      .bind(audit.user_id)
      .first<{ address_json: string | null }>();
    const addrPlain = await decryptField(userRow?.address_json);
    const home = parseJson<Partial<Address>>(addrPlain, {});

    // Self-heal: an address was saved but the original background geocode call
    // may have failed silently. Try once on this render so the user doesn't
    // have to re-save their profile to get commute estimates.
    if (
      (typeof home.lat !== "number" || typeof home.lng !== "number") &&
      home.line1 &&
      home.city &&
      home.state
    ) {
      try {
        const geo = await nominatimGeocode(
          [home.line1, home.city, home.state, home.zip].filter(Boolean).join(", ")
        );
        if (geo) {
          home.lat = geo.lat;
          home.lng = geo.lng;
          // Persist so we don't re-geocode on every page load.
          const augmented: Address = {
            line1: home.line1!,
            line2: home.line2,
            city: home.city!,
            state: home.state!,
            zip: home.zip ?? "",
            lat: geo.lat,
            lng: geo.lng,
          };
          await db
            .prepare("UPDATE users SET address_json = ? WHERE id = ?")
            .bind(await encryptJson(augmented), audit.user_id)
            .run();
        }
      } catch {
        // Nominatim down or rate-limited — UI will show "can't estimate" copy.
      }
    }

    if (
      store?.geocode_lat != null &&
      store?.geocode_lng != null &&
      typeof home.lat === "number" &&
      typeof home.lng === "number"
    ) {
      const route = await osrmRoute(
        { lat: home.lat, lng: home.lng },
        { lat: store.geocode_lat, lng: store.geocode_lng }
      );
      if (route) {
        modeEstimates = {
          drive: commuteSecondsForMode("drive", route),
          walk: commuteSecondsForMode("walk", route),
          transit: commuteSecondsForMode("transit", route),
        };
        const mode = (audit.commute_mode as TravelMode | null) ?? DEFAULT_TRAVEL_MODE;
        // User override (round-trip minutes) wins when set, but is clamped to
        // the slowest per-mode estimate so a typo can't run hours away.
        if (userMinutes != null && userMinutes > 0) {
          const slowestOneWay = Math.max(modeEstimates.drive, modeEstimates.walk, modeEstimates.transit);
          const slowestRoundTripMin = (slowestOneWay * 2) / 60;
          const clamped = Math.min(userMinutes, slowestRoundTripMin);
          oneWaySeconds = (clamped * 60) / 2;
        } else {
          oneWaySeconds = modeEstimates[mode];
        }
      }
    }
  }

  return {
    itemsDocumented,
    oneWayCommuteSeconds: oneWaySeconds,
    creditedHours: creditedHoursFromAuditInputs(itemsDocumented, oneWaySeconds),
    modeEstimates,
    userMinutes,
  };
}

/** Hours-only convenience wrapper for callers that don't need the breakdown. */
export async function computeCreditedHoursForAudit(auditId: string): Promise<number> {
  return (await previewCreditForAudit(auditId)).creditedHours;
}

async function getOrInitTrust(userId: string): Promise<TrustRow> {
  const db = getDb();
  // M5: race-safe init. The old SELECT-then-INSERT could double-insert when two
  // concurrent pipeline runs / polls hit a brand-new user (volunteer_trust has
  // user_id as PRIMARY KEY, so the second INSERT would throw). `ON CONFLICT DO
  // NOTHING` makes the seed idempotent; we then read the canonical row back.
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO volunteer_trust
        (user_id, tier, audits_completed, audits_flagged, audits_rejected, failed_audits_30_day_window, last_recalculated_at)
       VALUES (?, 0, 0, 0, 0, 0, ?)
       ON CONFLICT(user_id) DO NOTHING`
    )
    .bind(userId, now)
    .run();
  const row = await db
    .prepare("SELECT * FROM volunteer_trust WHERE user_id = ?")
    .bind(userId)
    .first<TrustRow>();
  if (row) return row;
  // Defensive fallback (should be unreachable: the upsert above guarantees a row).
  return {
    user_id: userId,
    tier: 0,
    audits_completed: 0,
    audits_flagged: 0,
    audits_rejected: 0,
    failed_audits_30_day_window: 0,
    last_recalculated_at: now,
  };
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

/**
 * Smallest distance (meters) from the store to any present location signal —
 * photo EXIF GPS and/or device GPS captured at photo time. Returns null when no
 * signal is available (callers treat null as "no evidence", not "near"). Any
 * signal placing the volunteer near the store clears the proof-of-presence check,
 * so a photo with no EXIF can still be validated against device GPS.
 */
export function nearestPresenceMeters(
  store: { lat: number; lng: number },
  signals: ReadonlyArray<{ lat: number | null; lng: number | null }>
): number | null {
  let best: number | null = null;
  for (const s of signals) {
    if (s.lat == null || s.lng == null) continue;
    const d = haversineMeters(store, { lat: s.lat, lng: s.lng });
    if (best == null || d < best) best = d;
  }
  return best;
}

// ---------------------------------------------------------------------------
// Open Prices contribution (Slice 3)
// ---------------------------------------------------------------------------

interface ContribRow {
  id: string;
  public_session_ref: string;
  audit_item_capture_id: string;
  basket_item_id: string;
  product_code: string | null;
  status: "pending" | "sent" | "failed" | "skipped";
  attempt_count: number;
  last_error: string | null;
  open_prices_id: string | null;
  posted_at: number | null;
  next_retry_at: number | null;
  created_at: number;
}

/**
 * For a verified audit, enqueue + attempt one Open Prices POST per in-stock
 * basket item with a mapped product code. Failures land in the retry queue.
 */
export async function contributeAuditToOpenPrices(auditId: string): Promise<void> {
  const db = getDb();
  const env = getEnv();
  const audit = await db.prepare("SELECT * FROM audits WHERE id = ?").bind(auditId).first<AuditRow>();
  if (!audit || audit.validation_status !== "verified") return;
  const ref = audit.public_session_ref;

  const captures =
    (
      await db
        .prepare(
          `SELECT * FROM audit_item_captures WHERE public_session_ref = ? AND stock_status = 'in-stock' AND price_usd IS NOT NULL`
        )
        .bind(ref)
        .all<AuditItemCaptureRow>()
    ).results ?? [];

  const store = audit.store_id
    ? await db.prepare("SELECT * FROM stores WHERE id = ?").bind(audit.store_id).first<Store>()
    : null;
  const now = Date.now();
  const dateStr = isoDate(audit.submitted_at ?? now);
  const sourceTag = `${OPEN_PRICES_PROJECT_TAG}:${audit.id}`;

  for (const cap of captures) {
    const existing = await db
      .prepare("SELECT id FROM open_prices_contributions WHERE audit_item_capture_id = ?")
      .bind(cap.id)
      .first<{ id: string }>();
    if (existing) continue;

    const item = findItem(cap.basket_item_id);
    if (!item) continue;
    const code = OFF_PRODUCT_CODES[cap.basket_item_id];
    const rowId = newId("opc");

    if (!code) {
      await db
        .prepare(
          `INSERT INTO open_prices_contributions
            (id, public_session_ref, audit_item_capture_id, basket_item_id, product_code, status, attempt_count, created_at)
           VALUES (?,?,?,?,?, 'skipped', 0, ?)`
        )
        .bind(rowId, ref, cap.id, cap.basket_item_id, null, now)
        .run();
      continue;
    }

    await db
      .prepare(
        `INSERT INTO open_prices_contributions
          (id, public_session_ref, audit_item_capture_id, basket_item_id, product_code, status, attempt_count, created_at)
         VALUES (?,?,?,?,?, 'pending', 0, ?)`
      )
      .bind(rowId, ref, cap.id, cap.basket_item_id, code, now)
      .run();

    if (!env.OPEN_PRICES_TOKEN) {
      await db
        .prepare(
          `UPDATE open_prices_contributions
           SET status = 'pending', last_error = 'No OPEN_PRICES_TOKEN configured.', next_retry_at = ?
           WHERE id = ?`
        )
        .bind(now + nextRetryDelayMs(0), rowId)
        .run();
      continue;
    }

    const result = await postOpenPrice({
      token: env.OPEN_PRICES_TOKEN,
      price: {
        product_code: code,
        price: normalizeUnitPrice(item, cap.price_usd!),
        currency: "USD",
        date: dateStr,
        location_label: store ? `${store.name}, ${store.address}` : undefined,
        source: sourceTag,
      },
    });

    if (result.ok) {
      await db
        .prepare(
          `UPDATE open_prices_contributions
           SET status = 'sent', open_prices_id = ?, posted_at = ?, attempt_count = 1
           WHERE id = ?`
        )
        .bind(result.open_prices_id ?? null, Date.now(), rowId)
        .run();
    } else {
      const delay = nextRetryDelayMs(0);
      await db
        .prepare(
          `UPDATE open_prices_contributions
           SET status = 'failed', attempt_count = 1, last_error = ?, next_retry_at = ?
           WHERE id = ?`
        )
        .bind((result.error ?? `HTTP ${result.status}`).slice(0, 500), now + delay, rowId)
        .run();
    }
  }
}

/** Drain the retry queue. Caller is the cron / manual admin trigger. */
export async function retryOpenPricesQueue(limit = 25): Promise<{ tried: number; sent: number; failed: number }> {
  const db = getDb();
  const env = getEnv();
  const now = Date.now();
  const rows =
    (
      await db
        .prepare(
          `SELECT * FROM open_prices_contributions
           WHERE status IN ('pending','failed') AND attempt_count < ?
             AND (next_retry_at IS NULL OR next_retry_at <= ?)
           ORDER BY created_at ASC
           LIMIT ?`
        )
        .bind(MAX_RETRY_ATTEMPTS, now, limit)
        .all<ContribRow>()
    ).results ?? [];

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    if (!env.OPEN_PRICES_TOKEN || !row.product_code) {
      const delay = nextRetryDelayMs(row.attempt_count);
      await db
        .prepare(
          `UPDATE open_prices_contributions SET next_retry_at = ?, last_error = ? WHERE id = ?`
        )
        .bind(
          now + delay,
          row.product_code ? "No OPEN_PRICES_TOKEN configured." : "No product code for basket item.",
          row.id
        )
        .run();
      failed++;
      continue;
    }
    const cap = await db
      .prepare("SELECT * FROM audit_item_captures WHERE id = ?")
      .bind(row.audit_item_capture_id)
      .first<AuditItemCaptureRow>();
    // The contribution row only knows public_session_ref; the private audit
    // row carries the store_id + submitted_at needed to format the price post.
    const audit = await db
      .prepare("SELECT * FROM audits WHERE public_session_ref = ?")
      .bind(row.public_session_ref)
      .first<AuditRow>();
    const store = audit?.store_id
      ? await db.prepare("SELECT * FROM stores WHERE id = ?").bind(audit.store_id).first<Store>()
      : null;
    const item = cap ? findItem(cap.basket_item_id) : undefined;
    if (!cap || !audit || !item || cap.price_usd == null) {
      await db
        .prepare(`UPDATE open_prices_contributions SET status = 'skipped' WHERE id = ?`)
        .bind(row.id)
        .run();
      continue;
    }
    const result = await postOpenPrice({
      token: env.OPEN_PRICES_TOKEN,
      price: {
        product_code: row.product_code,
        price: normalizeUnitPrice(item, cap.price_usd),
        currency: "USD",
        date: isoDate(audit.submitted_at ?? now),
        location_label: store ? `${store.name}, ${store.address}` : undefined,
        source: `${OPEN_PRICES_PROJECT_TAG}:${audit.id}`,
      },
    });

    if (result.ok) {
      await db
        .prepare(
          `UPDATE open_prices_contributions
           SET status = 'sent', open_prices_id = ?, posted_at = ?, attempt_count = attempt_count + 1,
               next_retry_at = NULL, last_error = NULL
           WHERE id = ?`
        )
        .bind(result.open_prices_id ?? null, Date.now(), row.id)
        .run();
      sent++;
    } else {
      const nextAttempt = row.attempt_count + 1;
      const exhausted = nextAttempt >= MAX_RETRY_ATTEMPTS;
      const delay = nextRetryDelayMs(nextAttempt);
      await db
        .prepare(
          `UPDATE open_prices_contributions
           SET status = ?, attempt_count = ?, last_error = ?, next_retry_at = ?
           WHERE id = ?`
        )
        .bind(
          exhausted ? "failed" : "pending",
          nextAttempt,
          (result.error ?? `HTTP ${result.status}`).slice(0, 500),
          exhausted ? null : now + delay,
          row.id
        )
        .run();
      failed++;
    }
  }

  return { tried: rows.length, sent, failed };
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
