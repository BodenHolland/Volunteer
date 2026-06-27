"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";
import { requireUser } from "@/lib/session";
import { putFile } from "@/lib/r2";
import { validateImageUploads } from "@/lib/images";
import { computeCreditedHoursForAudit, processAudit, recomputeTrust } from "@/lib/audit-pipeline";
import { logError } from "@/lib/audit";
import { creditHoursStmt } from "@/lib/ledger";
import { pendingFlagInsertStmts } from "@/lib/pipeline";
import { fetchOsmNearby, nominatimSearch, type NearbyStore } from "@/lib/places";
import { haversineMeters } from "@/lib/geo";
import {
  ANTI_DUP_WINDOW_DAYS,
  detectPii,
  findItem,
  isInCalifornia,
  isInUnitedStates,
  syncValidate,
  USDA_THRIFTY_6,
  type AuditRow,
  type AuditItemCaptureRow,
  type CaptureInput,
  type EbtObservation,
  type ProducePricingMode,
  type StockStatus,
  type Store,
  type StoreType,
} from "@/lib/food-audit";

async function loadOwnedAudit(auditId: string): Promise<AuditRow | null> {
  const user = await requireUser();
  const a = await getDb()
    .prepare("SELECT * FROM audits WHERE id = ?")
    .bind(auditId)
    .first<AuditRow>();
  if (!a || a.user_id !== user.id) return null;
  return a;
}

/**
 * Free-text store search. Hits two sources in parallel and merges them:
 *  - Our D1 `stores` table (instant, includes already-audited stores)
 *  - OpenStreetMap Nominatim (broad, US-scoped, free, keyless)
 *
 * Results are deduped by OSM place_id (so a store we've audited before doesn't
 * appear twice once Nominatim also returns it) and ranked by distance from the
 * optional location hint, falling back to name order.
 */
export async function searchStoresAction(
  query: string,
  hint?: { lat: number; lng: number } | null
): Promise<NearbyStore[]> {
  await requireUser();
  const q = query.trim();
  if (q.length < 2) return [];

  const like = `%${q.toLowerCase()}%`;
  const [dbRes, osm] = await Promise.all([
    getDb()
      .prepare(
        `SELECT id, name, address, geocode_lat, geocode_lng, google_place_id
         FROM stores WHERE LOWER(name) LIKE ? OR LOWER(address) LIKE ? ORDER BY name LIMIT 10`
      )
      .bind(like, like)
      .all<{
        id: string;
        name: string;
        address: string;
        geocode_lat: number | null;
        geocode_lng: number | null;
        google_place_id: string | null;
      }>(),
    nominatimSearch(q, hint ?? undefined, 10),
  ]);

  const dbResults: NearbyStore[] = (dbRes.results ?? []).map((s) => ({
    source: "db",
    store_id: s.id,
    place_id: s.google_place_id,
    name: s.name,
    address: s.address,
    lat: s.geocode_lat ?? 0,
    lng: s.geocode_lng ?? 0,
    distance_m:
      hint && s.geocode_lat != null && s.geocode_lng != null
        ? Math.round(haversineMeters({ lat: hint.lat, lng: hint.lng }, { lat: s.geocode_lat, lng: s.geocode_lng }))
        : 0,
  }));

  const seen = new Set(dbResults.map((s) => s.place_id).filter(Boolean) as string[]);
  const merged = [...dbResults, ...osm.filter((o) => !o.place_id || !seen.has(o.place_id))];
  if (hint) merged.sort((a, b) => a.distance_m - b.distance_m);
  return merged.slice(0, 10);
}

export async function selectStoreAction(formData: FormData) {
  const auditId = String(formData.get("audit_id") ?? "");
  const storeId = String(formData.get("store_id") ?? "");
  const a = await loadOwnedAudit(auditId);
  if (!a) return;
  await getDb().prepare("UPDATE audits SET store_id = ? WHERE id = ?").bind(storeId, auditId).run();
  revalidatePath(`/app/audits/${auditId}`);
}

/**
 * Stores near a device location: existing D1 stores (within 25 km) merged with
 * live OpenStreetMap food retailers, sorted by distance. Powers the
 * "Use my location" path in the store step.
 */
export async function nearbyStoresAction(lat: number, lng: number): Promise<NearbyStore[]> {
  await requireUser();
  if (!isInUnitedStates(lat, lng)) return [];
  const db = getDb();
  const dbRows =
    (
      await db
        .prepare(
          `SELECT id, name, address, geocode_lat, geocode_lng, google_place_id
           FROM stores WHERE geocode_lat IS NOT NULL AND geocode_lng IS NOT NULL`
        )
        .all<{
          id: string;
          name: string;
          address: string;
          geocode_lat: number;
          geocode_lng: number;
          google_place_id: string | null;
        }>()
    ).results ?? [];

  const dbNearby: NearbyStore[] = dbRows
    .map((s) => ({
      source: "db" as const,
      store_id: s.id,
      place_id: s.google_place_id,
      name: s.name,
      address: s.address,
      lat: s.geocode_lat,
      lng: s.geocode_lng,
      distance_m: Math.round(haversineMeters({ lat: lat, lng: lng }, { lat: s.geocode_lat, lng: s.geocode_lng })),
    }))
    .filter((s) => s.distance_m <= 25_000);

  const osm = await fetchOsmNearby(lat, lng);
  const seen = new Set(dbNearby.map((s) => s.place_id).filter(Boolean) as string[]);
  const merged = [...dbNearby, ...osm.filter((o) => !o.place_id || !seen.has(o.place_id))];
  merged.sort((a, b) => a.distance_m - b.distance_m);
  return merged.slice(0, 10);
}

/**
 * Assign a store picked from the nearby list. DB results reuse their row;
 * OpenStreetMap results create (or reuse, by place id) a store row first.
 */
export async function selectNearbyStoreAction(formData: FormData) {
  const auditId = String(formData.get("audit_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const lat = Number(formData.get("lat") ?? NaN);
  const lng = Number(formData.get("lng") ?? NaN);
  const placeId = String(formData.get("place_id") ?? "").trim() || null;
  if (!name || !address) return;
  if (detectPii(name) || detectPii(address)) {
    revalidatePath(`/app/audits/${auditId}`);
    return;
  }
  const geoLat = Number.isFinite(lat) ? lat : null;
  const geoLng = Number.isFinite(lng) ? lng : null;
  if (!isInUnitedStates(geoLat, geoLng)) {
    revalidatePath(`/app/audits/${auditId}`);
    return;
  }

  const a = await loadOwnedAudit(auditId);
  if (!a) return;
  const db = getDb();

  let storeId: string | null = null;
  if (placeId) {
    const existing = await db
      .prepare("SELECT id FROM stores WHERE google_place_id = ?")
      .bind(placeId)
      .first<{ id: string }>();
    storeId = existing?.id ?? null;
  }
  if (!storeId) {
    storeId = newId("store");
    const user = await requireUser();
    await db
      .prepare(
        `INSERT INTO stores (id, name, address, geocode_lat, geocode_lng, google_place_id, created_by_user_id, created_at)
         VALUES (?,?,?,?,?,?,?,?)`
      )
      .bind(storeId, name, address, geoLat, geoLng, placeId, user.id, Date.now())
      .run();
  }
  await db.prepare("UPDATE audits SET store_id = ? WHERE id = ?").bind(storeId, auditId).run();
  revalidatePath(`/app/audits/${auditId}`);
}

export async function createStoreAction(formData: FormData): Promise<void> {
  const auditId = String(formData.get("audit_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const lat = Number(formData.get("lat") ?? NaN);
  const lng = Number(formData.get("lng") ?? NaN);
  if (!name || !address) return;

  const piiName = detectPii(name);
  const piiAddress = detectPii(address);
  if (piiName || piiAddress) {
    revalidatePath(`/app/audits/${auditId}`);
    return;
  }

  const geoLat = Number.isFinite(lat) ? lat : null;
  const geoLng = Number.isFinite(lng) ? lng : null;
  if (!isInCalifornia(geoLat, geoLng)) {
    revalidatePath(`/app/audits/${auditId}`);
    return;
  }

  const a = await loadOwnedAudit(auditId);
  if (!a) return;
  const id = newId("store");
  const user = await requireUser();
  await getDb()
    .prepare(
      `INSERT INTO stores (id, name, address, geocode_lat, geocode_lng, created_by_user_id, created_at)
       VALUES (?,?,?,?,?,?,?)`
    )
    .bind(id, name, address, geoLat, geoLng, user.id, Date.now())
    .run();
  await getDb().prepare("UPDATE audits SET store_id = ? WHERE id = ?").bind(id, auditId).run();
  revalidatePath(`/app/audits/${auditId}`);
}

export async function setStoreTypeAction(formData: FormData) {
  const auditId = String(formData.get("audit_id") ?? "");
  const t = String(formData.get("store_type") ?? "") as StoreType;
  const a = await loadOwnedAudit(auditId);
  if (!a) return;
  await getDb().prepare("UPDATE audits SET store_type_observed = ? WHERE id = ?").bind(t, auditId).run();
  revalidatePath(`/app/audits/${auditId}`);
}

export async function setCommuteModeAction(formData: FormData) {
  const auditId = String(formData.get("audit_id") ?? "");
  const mode = String(formData.get("commute_mode") ?? "");
  if (!["drive", "walk", "transit"].includes(mode)) return;
  const a = await loadOwnedAudit(auditId);
  if (!a) return;
  await getDb().prepare("UPDATE audits SET commute_mode = ? WHERE id = ?").bind(mode, auditId).run();
  revalidatePath(`/app/audits/${auditId}`);
}

export async function setCommuteUserMinutesAction(formData: FormData) {
  const auditId = String(formData.get("audit_id") ?? "");
  const raw = String(formData.get("minutes") ?? "").trim();
  const a = await loadOwnedAudit(auditId);
  if (!a) return;
  if (raw === "") {
    // Clearing the override falls back to the per-mode estimate.
    await getDb().prepare("UPDATE audits SET commute_user_minutes = NULL WHERE id = ?").bind(auditId).run();
  } else {
    const n = Math.max(0, Math.round(Number(raw)));
    if (!Number.isFinite(n)) return;
    await getDb()
      .prepare("UPDATE audits SET commute_user_minutes = ? WHERE id = ?")
      .bind(n, auditId)
      .run();
  }
  revalidatePath(`/app/audits/${auditId}`);
}

export async function setEbtAction(formData: FormData) {
  const auditId = String(formData.get("audit_id") ?? "");
  const v = String(formData.get("ebt") ?? "") as EbtObservation;
  const a = await loadOwnedAudit(auditId);
  if (!a) return;
  await getDb().prepare("UPDATE audits SET ebt_observation = ? WHERE id = ?").bind(v, auditId).run();
  revalidatePath(`/app/audits/${auditId}`);
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(h))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function captureItemAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const auditId = String(formData.get("audit_id") ?? "");
  const itemId = String(formData.get("basket_item_id") ?? "");
  try {
    return await captureItemInner(formData, auditId, itemId);
  } catch (err) {
    await logError("captureItemAction", err, { auditId, itemId });
    return { ok: false, error: "Couldn't save that item. The error is logged — try again." };
  }
}

async function captureItemInner(
  formData: FormData,
  auditId: string,
  itemId: string
): Promise<{ ok: boolean; error?: string }> {
  const stockStatus = String(formData.get("stock_status") ?? "") as StockStatus;
  const a = await loadOwnedAudit(auditId);
  if (!a) return { ok: false, error: "Not found." };

  const item = findItem(itemId);
  if (!item) return { ok: false, error: "Unknown item." };

  const cap: CaptureInput = { stock_status: stockStatus };
  if (stockStatus === "in-stock") {
    cap.price_usd = Number(formData.get("price_usd") ?? NaN);
    cap.size_value = Number(formData.get("size_value") ?? NaN);
    cap.size_unit = String(formData.get("size_unit") ?? "");
    const mode = String(formData.get("produce_pricing_mode") ?? "");
    if (mode) cap.produce_pricing_mode = mode as ProducePricingMode;
    const photo = formData.get("photo");
    cap.has_photo = photo instanceof File && photo.size > 0;
  }

  const now = Date.now();
  let photoId: string | null = null;

  if (cap.stock_status === "in-stock") {
    const photo = formData.get("photo");
    if (!(photo instanceof File) || photo.size === 0) {
      return { ok: false, error: "Photo of the item and shelf tag is required." };
    }
    // Authoritative per-file byte cap, enforced BEFORE arrayBuffer() pulls the
    // body into the 128 MB Worker isolate. The client downscales the camera
    // capture first (see audit-client PhotoCapture); this is the backstop if
    // that's bypassed/unavailable. One photo per item, so count/total are moot
    // here — the per-file cap is the relevant guard. Server-side re-encode would
    // need Cloudflare Images (not provisioned) or an in-Worker image lib (none
    // installed), so client downscale + this cap is the chosen approach.
    const photoCheck = validateImageUploads([photo], { maxCount: 1 });
    if (!photoCheck.ok) {
      return { ok: false, error: photoCheck.error };
    }
    const buf = await photo.arrayBuffer();
    const sha = await sha256Hex(buf);
    photoId = newId("photo");
    const r2Key = `audits/${auditId}/${itemId}_${photoId}.jpg`;
    await putFile(r2Key, buf, photo.type || "image/jpeg");
    const exifLatRaw = Number(formData.get("exif_lat") ?? NaN);
    const exifLngRaw = Number(formData.get("exif_lng") ?? NaN);
    const exifTsRaw = Number(formData.get("exif_ts") ?? NaN);
    const exifLat = Number.isFinite(exifLatRaw) ? exifLatRaw : null;
    const exifLng = Number.isFinite(exifLngRaw) ? exifLngRaw : null;
    const exifTs = Number.isFinite(exifTsRaw) ? exifTsRaw : null;
    // PUBLIC photo row (no EXIF, no audit_id) keyed by public_session_ref.
    await getDb()
      .prepare(
        `INSERT INTO audit_photos (id, public_session_ref, audit_item_capture_id, r2_key, sha256,
           uploaded_at, vision_validation_status)
         VALUES (?,?,?,?,?,?,?)`
      )
      .bind(photoId, a.public_session_ref, null, r2Key, sha, now, "pending")
      .run();
    // PRIVATE EXIF row (camera GPS + capture time) keyed by photo_id.
    if (exifTs != null || exifLat != null || exifLng != null) {
      await getDb()
        .prepare(
          `INSERT INTO audit_photo_exif (photo_id, exif_timestamp, exif_geocode_lat, exif_geocode_lng)
           VALUES (?,?,?,?)`
        )
        .bind(photoId, exifTs, exifLat, exifLng)
        .run();
    }
  }

  const err = validateAndStore(cap, itemId);
  if (err) return { ok: false, error: err };

  // Upsert capture — keyed by (public_session_ref, basket_item_id).
  const db = getDb();
  const existing = await db
    .prepare("SELECT id FROM audit_item_captures WHERE public_session_ref = ? AND basket_item_id = ?")
    .bind(a.public_session_ref, itemId)
    .first<{ id: string }>();
  const capId = existing?.id ?? newId("capture");
  if (existing) {
    await db
      .prepare(
        `UPDATE audit_item_captures
         SET stock_status = ?, price_usd = ?, size_value = ?, size_unit = ?,
             produce_pricing_mode = ?, photo_id = ?, captured_at = ?
         WHERE id = ?`
      )
      .bind(
        cap.stock_status,
        cap.price_usd ?? null,
        cap.size_value ?? null,
        cap.size_unit ?? null,
        cap.produce_pricing_mode ?? null,
        photoId,
        now,
        capId
      )
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO audit_item_captures (id, public_session_ref, basket_item_id, stock_status, price_usd, size_value, size_unit, produce_pricing_mode, photo_id, captured_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)`
      )
      .bind(
        capId,
        a.public_session_ref,
        itemId,
        cap.stock_status,
        cap.price_usd ?? null,
        cap.size_value ?? null,
        cap.size_unit ?? null,
        cap.produce_pricing_mode ?? null,
        photoId,
        now
      )
      .run();
  }
  if (photoId) {
    await db
      .prepare("UPDATE audit_photos SET audit_item_capture_id = ? WHERE id = ?")
      .bind(capId, photoId)
      .run();
  }
  revalidatePath(`/app/audits/${auditId}`);
  return { ok: true };
}

function validateAndStore(cap: CaptureInput, itemId: string): string | null {
  if (cap.stock_status !== "in-stock") return null;
  const item = findItem(itemId)!;
  if (cap.price_usd == null || !Number.isFinite(cap.price_usd) || cap.price_usd < 0) {
    return "Enter a price.";
  }
  if (cap.size_value == null || !Number.isFinite(cap.size_value) || cap.size_value <= 0) {
    return "Enter a size.";
  }
  if (!cap.size_unit || !item.unit_options.includes(cap.size_unit)) {
    return "Pick a unit from the options.";
  }
  if (item.category === "produce" && !cap.produce_pricing_mode) {
    return "Tell us if produce is per-pound or per-unit.";
  }
  return null;
}

/**
 * Cancel a claimed-but-unsubmitted audit — "I picked this up by accident."
 * Deletes the audit, its captured items/photos/flags, and the still-open
 * submission row so the task fully leaves the recipient's queue. No hours were
 * ever credited (nothing is submitted), so there is nothing to claw back.
 * Once an audit has been submitted for review, cancelling is disallowed.
 */
export async function cancelAuditAction(formData: FormData) {
  const auditId = String(formData.get("audit_id") ?? "");
  const a = await loadOwnedAudit(auditId);
  if (!a) redirect("/app");
  if (a.submitted_at) redirect(`/app/audits/${auditId}`);

  const db = getDb();
  // Wipe the public cluster via public_session_ref. EXIF rows orphan when their
  // photo rows go — clean them up directly using the photo ids we're about to drop.
  await db
    .prepare(
      `DELETE FROM audit_photo_exif WHERE photo_id IN (SELECT id FROM audit_photos WHERE public_session_ref = ?)`
    )
    .bind(a.public_session_ref)
    .run();
  await db.prepare("DELETE FROM audit_photos WHERE public_session_ref = ?").bind(a.public_session_ref).run();
  await db.prepare("DELETE FROM audit_item_captures WHERE public_session_ref = ?").bind(a.public_session_ref).run();
  await db.prepare("DELETE FROM audit_public_summaries WHERE public_session_ref = ?").bind(a.public_session_ref).run();
  // Private side: validation flags FK to audits.id; drop those then the audit.
  await db.prepare("DELETE FROM audit_validation_flags WHERE audit_id = ?").bind(auditId).run();
  await db.prepare("DELETE FROM audits WHERE id = ?").bind(auditId).run();
  await db.prepare("DELETE FROM submissions WHERE id = ?").bind(a.submission_id).run();

  revalidatePath("/app");
  redirect("/app");
}

export async function submitAuditAction(formData: FormData) {
  const auditId = String(formData.get("audit_id") ?? "");
  const sessionSeconds = Math.max(0, Math.floor(Number(formData.get("session_seconds") ?? 0)));
  try {
    return await submitAuditInner(formData, auditId, sessionSeconds);
  } catch (err) {
    // Next's redirect() throws a NEXT_REDIRECT digest error that MUST propagate.
    if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    await logError("submitAuditAction", err, { auditId, sessionSeconds });
    return { ok: false, error: "Couldn't submit the audit. The error is logged — try again." };
  }
}

async function submitAuditInner(formData: FormData, auditId: string, sessionSeconds: number) {
  const a = await loadOwnedAudit(auditId);
  if (!a) redirect("/app/tasks");
  if (!a.store_id || !a.store_type_observed || !a.ebt_observation) {
    return { ok: false, error: "Finish the location, store type, and EBT steps first." };
  }

  const db = getDb();
  const captures = await db
    .prepare("SELECT * FROM audit_item_captures WHERE public_session_ref = ?")
    .bind(a.public_session_ref)
    .all<AuditItemCaptureRow>();
  if ((captures.results?.length ?? 0) !== USDA_THRIFTY_6.items.length) {
    return { ok: false, error: "Capture all 6 basket items before submitting." };
  }

  const store = await db
    .prepare("SELECT * FROM stores WHERE id = ?")
    .bind(a.store_id)
    .first<Store>();
  if (!store) return { ok: false, error: "Store not found." };

  const since = Date.now() - ANTI_DUP_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const dup = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM audits
       WHERE user_id = ? AND store_id = ? AND id != ? AND submitted_at IS NOT NULL AND submitted_at >= ?`
    )
    .bind(a.user_id, a.store_id, a.id, since)
    .first<{ n: number }>();
  const dupCount = dup?.n ?? 0;

  const hourAgo = Date.now() - 60 * 60 * 1000;
  const rapid = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM audits WHERE user_id = ? AND submitted_at IS NOT NULL AND submitted_at >= ?`
    )
    .bind(a.user_id, hourAgo)
    .first<{ n: number }>();

  const result = syncValidate({
    captures: (captures.results ?? []).map((c) => ({
      item_id: c.basket_item_id,
      capture: {
        stock_status: c.stock_status,
        price_usd: c.price_usd ?? undefined,
        size_value: c.size_value ?? undefined,
        size_unit: c.size_unit ?? undefined,
        produce_pricing_mode: c.produce_pricing_mode ?? undefined,
        has_photo: c.photo_id != null,
      },
    })),
    store_geocode: { lat: store.geocode_lat, lng: store.geocode_lng },
    session_time_seconds: sessionSeconds,
    prior_audit_count_at_store_in_window: dupCount,
    rapid_submission_count_last_hour: rapid?.n ?? 0,
  });

  if (!result.ok) return { ok: false, error: result.reason };

  const now = Date.now();
  for (const stmt of pendingFlagInsertStmts(db, a.id, result.flags, now)) {
    await stmt.run();
  }

  await db
    .prepare(
      `UPDATE audits
       SET submitted_at = ?, session_time_seconds = ?, validation_status = 'submitted',
           validation_flag_count = ?
       WHERE id = ?`
    )
    .bind(now, sessionSeconds, result.flags.length, a.id)
    .run();

  // Freeze an immutable snapshot of the store onto the audit, so this serialized
  // record stays self-contained even if the shared store row is later edited.
  // Best-effort: tolerate DBs that predate the 0010 migration.
  try {
    await db
      .prepare(
        `UPDATE audits
         SET store_name_snapshot = ?, store_address_snapshot = ?,
             store_geocode_lat_snapshot = ?, store_geocode_lng_snapshot = ?
         WHERE id = ?`
      )
      .bind(store.name, store.address, store.geocode_lat, store.geocode_lng, a.id)
      .run();
  } catch (err) {
    await logError("auditStoreSnapshot", err, { auditId: a.id });
  }

  // Materialize the PUBLIC summary row. Holds only store-level facts safe to
  // publish; verified_at flips later when the pipeline approves. Migration
  // 0016 keeps these tables physically separated from anything with a user_id.
  await db
    .prepare(
      `INSERT INTO audit_public_summaries
         (public_session_ref, store_name, store_address, store_geocode_lat, store_geocode_lng,
          store_type_observed, ebt_observation, submitted_at, verified_at)
       VALUES (?,?,?,?,?,?,?,?, NULL)
       ON CONFLICT(public_session_ref) DO UPDATE SET
         store_name = excluded.store_name,
         store_address = excluded.store_address,
         store_geocode_lat = excluded.store_geocode_lat,
         store_geocode_lng = excluded.store_geocode_lng,
         store_type_observed = excluded.store_type_observed,
         ebt_observation = excluded.ebt_observation,
         submitted_at = excluded.submitted_at`
    )
    .bind(
      a.public_session_ref,
      store.name,
      store.address,
      store.geocode_lat,
      store.geocode_lng,
      a.store_type_observed,
      a.ebt_observation,
      now
    )
    .run();

  // Submission stays in 'submitted' until async pipeline routes it to approved/rejected/pending_review.
  await db
    .prepare(
      `UPDATE submissions
       SET status = 'ai_reviewing', submitted_at = ?, measured_active_seconds = ?
       WHERE id = ?`
    )
    .bind(now, sessionSeconds, a.submission_id)
    .run();

  try {
    getCloudflareContext().ctx.waitUntil(processAudit(a.id));
  } catch {
    /* outside Workers runtime (e.g. local node test) — pipeline runs lazily via the status poll. */
  }

  redirect(`/app/audits/${auditId}/done`);
}

/**
 * Admin action: approve a submitted audit. Credits hours into hours_ledger
 * via the existing pathway, mirroring app/org/org-actions.ts.
 */
export async function adminApproveAuditAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/unauthorized");
  const auditId = String(formData.get("audit_id") ?? "");
  const db = getDb();
  const a = await db.prepare("SELECT * FROM audits WHERE id = ?").bind(auditId).first<AuditRow>();
  if (!a) return;

  const credited = await computeCreditedHoursForAudit(a.id);
  const now = Date.now();

  // Read the recipient first so the ledger credit can ride in the same batch.
  const sub = await db
    .prepare("SELECT user_id FROM submissions WHERE id = ?")
    .bind(a.submission_id)
    .first<{ user_id: string }>();

  // Atomic batch: the audit verify, the public-summary publish, the
  // irreversible submission status='approved' flip, and the ledger credit all
  // commit together or roll back together (D1 implicit transaction).
  const batch: D1PreparedStatement[] = [
    db
      .prepare(`UPDATE audits SET validation_status = 'verified', credited_hours = ? WHERE id = ?`)
      .bind(credited, a.id),
    db
      .prepare(`UPDATE audit_public_summaries SET verified_at = ? WHERE public_session_ref = ?`)
      .bind(now, a.public_session_ref),
    db
      .prepare(
        `UPDATE submissions
         SET status = 'approved', reviewer_id = ?, reviewed_at = ?, hours_credited = ?
         WHERE id = ?`
      )
      .bind(user.id, now, credited, a.submission_id),
  ];
  if (sub?.user_id && credited > 0) {
    batch.push(creditHoursStmt(db, { userId: sub.user_id, hours: credited, certifiedOrgId: "org_food_access" }));
  }
  await db.batch(batch);

  if (sub?.user_id) {
    await recomputeTrust(sub.user_id);
  }
  revalidatePath("/admin/audits");
}

export async function adminRejectAuditAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/unauthorized");
  const auditId = String(formData.get("audit_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const db = getDb();
  const a = await db.prepare("SELECT submission_id FROM audits WHERE id = ?").bind(auditId).first<{ submission_id: string }>();
  if (!a) return;
  const now = Date.now();
  await db
    .prepare(`UPDATE audits SET validation_status = 'rejected' WHERE id = ?`)
    .bind(auditId)
    .run();
  await db
    .prepare(
      `UPDATE submissions
       SET status = 'rejected', reviewer_id = ?, reviewed_at = ?, reviewer_notes = ?
       WHERE id = ?`
    )
    .bind(user.id, now, reason || "Audit rejected during spot review.", a.submission_id)
    .run();
  revalidatePath("/admin/audits");
}
