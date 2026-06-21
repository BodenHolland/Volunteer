/**
 * Food Access Price Audit — domain types, basket template, validators.
 *
 * Slice 1: sync validation only. Async vision validation and trust tiers land in Slice 2.
 */

export const BASKET_TEMPLATE_ID = "usda-thrifty-6";
export const BASKET_TEMPLATE_VERSION = "2026.1";

export const SESSION_MIN_SECONDS = 240;
export const SESSION_MAX_SECONDS = 1500;
export const SESSION_TARGET_MINUTES = 12;
export const SESSION_CAP_MINUTES = 15;
export const ANTI_DUP_WINDOW_DAYS = 7;

export type StoreType =
  | "chain-supermarket"
  | "independent-grocery"
  | "corner-store-bodega"
  | "ethnic-market"
  | "farmers-market"
  | "dollar-store"
  | "other";

export const STORE_TYPES: { value: StoreType; label: string; help: string }[] = [
  { value: "chain-supermarket", label: "Chain supermarket", help: "Safeway, Kroger, Albertsons, Walmart, Target" },
  { value: "independent-grocery", label: "Independent grocery", help: "Local non-chain" },
  { value: "corner-store-bodega", label: "Corner store / bodega", help: "Small neighborhood store" },
  { value: "ethnic-market", label: "Ethnic market", help: "Asian, Latino, Halal, etc." },
  { value: "farmers-market", label: "Farmers market", help: "" },
  { value: "dollar-store", label: "Dollar store", help: "Dollar Tree, 99 Cents Only, Dollar General" },
  { value: "other", label: "Other", help: "" },
];

export type EbtObservation =
  | "signage-visible"
  | "asked-staff-accepted"
  | "asked-staff-not-accepted"
  | "not-visible";

export const EBT_OBSERVATIONS: { value: EbtObservation; label: string }[] = [
  { value: "signage-visible", label: "Yes — saw EBT signage at the register or entrance" },
  { value: "asked-staff-accepted", label: "Asked staff — they confirmed they accept EBT" },
  { value: "asked-staff-not-accepted", label: "Asked staff — they said they don't accept EBT" },
  { value: "not-visible", label: "Couldn't tell — no signage and didn't ask" },
];

export type StockStatus = "in-stock" | "out-of-stock" | "not-sold-at-this-store";
export type ProducePricingMode = "per-pound" | "per-unit";

export type BasketItemCategory = "dairy" | "eggs" | "bread" | "rice" | "beans" | "produce";

export interface BasketItem {
  id: string;
  display_name: string;
  spec: string;
  category: BasketItemCategory;
  expected_size_range_min: number;
  expected_size_range_max: number;
  expected_size_unit: string;
  plausibility_band_usd_low: number;
  plausibility_band_usd_high: number;
  unit_options: string[];
  size_capture: "fixed" | "flexible";
  extra_field?: { id: string; type: string; options: string[]; required: boolean };
}

export interface BasketTemplateConfig {
  id: string;
  version: string;
  display_name: string;
  items: BasketItem[];
}

export const USDA_THRIFTY_6: BasketTemplateConfig = {
  id: BASKET_TEMPLATE_ID,
  version: BASKET_TEMPLATE_VERSION,
  display_name: "USDA Thrifty 6-Item Basket",
  items: [
    {
      id: "milk-gallon",
      display_name: "Milk",
      spec: "1 gallon, whole, generic / store brand",
      category: "dairy",
      expected_size_range_min: 1,
      expected_size_range_max: 1,
      expected_size_unit: "gal",
      plausibility_band_usd_low: 2.5,
      plausibility_band_usd_high: 12.0,
      unit_options: ["gal", "ml", "L"],
      size_capture: "fixed",
    },
    {
      id: "eggs-dozen",
      display_name: "Eggs",
      spec: "1 dozen, large, Grade A, generic / store brand",
      category: "eggs",
      expected_size_range_min: 12,
      expected_size_range_max: 12,
      expected_size_unit: "count",
      plausibility_band_usd_low: 1.5,
      plausibility_band_usd_high: 15.0,
      unit_options: ["count"],
      size_capture: "fixed",
    },
    {
      id: "bread-loaf",
      display_name: "Bread",
      spec: "1 standard loaf (16–20 oz), sliced white or whole wheat",
      category: "bread",
      expected_size_range_min: 16,
      expected_size_range_max: 20,
      expected_size_unit: "oz",
      plausibility_band_usd_low: 1.0,
      plausibility_band_usd_high: 10.0,
      unit_options: ["oz", "lb"],
      size_capture: "fixed",
    },
    {
      id: "rice-1lb",
      display_name: "Rice",
      spec: "1 lb bag, standard white long-grain",
      category: "rice",
      expected_size_range_min: 1,
      expected_size_range_max: 1,
      expected_size_unit: "lb",
      plausibility_band_usd_low: 0.5,
      plausibility_band_usd_high: 6.0,
      unit_options: ["lb", "oz"],
      size_capture: "fixed",
    },
    {
      id: "beans-can",
      display_name: "Canned beans",
      spec: "1 standard can (15–16 oz), black or pinto",
      category: "beans",
      expected_size_range_min: 15,
      expected_size_range_max: 16,
      expected_size_unit: "oz",
      plausibility_band_usd_low: 0.5,
      plausibility_band_usd_high: 5.0,
      unit_options: ["oz"],
      size_capture: "fixed",
    },
    {
      id: "produce-banana-or-apple",
      display_name: "Fresh produce",
      spec: "Bananas or apples — per pound or per unit (whichever the store sells)",
      category: "produce",
      expected_size_range_min: 0.1,
      expected_size_range_max: 5.0,
      expected_size_unit: "lb",
      plausibility_band_usd_low: 0.15,
      plausibility_band_usd_high: 5.0,
      unit_options: ["lb", "count"],
      size_capture: "flexible",
      extra_field: {
        id: "produce_pricing_mode",
        type: "multi-choice",
        options: ["per-pound", "per-unit"],
        required: true,
      },
    },
  ],
};

// ---------- DB row types ----------

export interface Store {
  id: string;
  name: string;
  address: string;
  geocode_lat: number | null;
  geocode_lng: number | null;
  google_place_id: string | null;
  created_by_user_id: string | null;
  created_at: number;
}

export type AuditValidationStatus =
  | "draft"
  | "submitted"
  | "validating"
  | "verified"
  | "flagged"
  | "rejected";

export interface AuditRow {
  id: string;
  submission_id: string;
  user_id: string;
  store_id: string | null;
  basket_template_id: string;
  basket_template_version: string;
  store_type_observed: StoreType | null;
  ebt_observation: EbtObservation | null;
  started_at: number;
  submitted_at: number | null;
  session_time_seconds: number;
  validation_status: AuditValidationStatus;
  validation_flag_count: number;
  credited_hours: number | null;
  trust_tier_at_submission: number;
}

export interface AuditItemCaptureRow {
  id: string;
  audit_id: string;
  basket_item_id: string;
  stock_status: StockStatus;
  price_usd: number | null;
  size_value: number | null;
  size_unit: string | null;
  produce_pricing_mode: ProducePricingMode | null;
  photo_id: string | null;
  captured_at: number;
}

export interface AuditPhotoRow {
  id: string;
  audit_id: string;
  audit_item_capture_id: string | null;
  r2_key: string;
  thumb_r2_key: string | null;
  sha256: string | null;
  exif_timestamp: number | null;
  exif_geocode_lat: number | null;
  exif_geocode_lng: number | null;
  uploaded_at: number;
  vision_validation_status: "pending" | "running" | "passed" | "failed" | "skipped";
  vision_result_json: string | null;
  ocr_price_value: number | null;
}

export interface ValidationFlagRow {
  id: string;
  audit_id: string;
  flag_type: string;
  flag_severity: "block" | "review";
  flag_reason: string;
  flag_metadata_json: string | null;
  created_at: number;
  resolution_status: "open" | "resolved-accept" | "resolved-reject" | "resolved-accept-with-correction";
  resolved_by_admin_id: string | null;
  resolved_at: number | null;
  admin_note: string | null;
}

// ---------- Validators (synchronous) ----------

/** California rough bounding box. */
export function isInCalifornia(lat: number | null, lng: number | null): boolean {
  if (lat == null || lng == null) return false;
  return lat >= 32.5 && lat <= 42.0 && lng >= -124.5 && lng <= -114.0;
}

export function findItem(id: string): BasketItem | undefined {
  return USDA_THRIFTY_6.items.find((i) => i.id === id);
}

export interface CaptureInput {
  stock_status: StockStatus;
  price_usd?: number;
  size_value?: number;
  size_unit?: string;
  produce_pricing_mode?: ProducePricingMode;
  has_photo?: boolean;
}

export function validateCapture(itemId: string, c: CaptureInput): string | null {
  const item = findItem(itemId);
  if (!item) return "Unknown basket item.";
  if (c.stock_status !== "in-stock") return null;
  if (c.price_usd == null || !Number.isFinite(c.price_usd) || c.price_usd < 0) {
    return "Price is required.";
  }
  if (c.size_value == null || !Number.isFinite(c.size_value) || c.size_value <= 0) {
    return "Size is required.";
  }
  if (!c.size_unit || !item.unit_options.includes(c.size_unit)) {
    return "Pick a valid unit.";
  }
  if (item.category === "produce" && !c.produce_pricing_mode) {
    return "For produce, tell us if it's per pound or per unit.";
  }
  if (c.has_photo === false) return "A photo of the item and its price tag is required.";
  return null;
}

/** Returns flag-objects to insert (sync, pre-submission). Empty = clean. */
export interface PendingFlag {
  flag_type: string;
  flag_severity: "block" | "review";
  flag_reason: string;
  metadata?: unknown;
}

export interface SubmitCheckInput {
  captures: { item_id: string; capture: CaptureInput }[];
  store_geocode: { lat: number | null; lng: number | null };
  session_time_seconds: number;
  prior_audit_count_at_store_in_window: number;
  rapid_submission_count_last_hour: number;
}

export function syncValidate(input: SubmitCheckInput): { ok: boolean; reason?: string; flags: PendingFlag[] } {
  const flags: PendingFlag[] = [];

  if (input.captures.length !== USDA_THRIFTY_6.items.length) {
    return { ok: false, reason: "All 6 basket items must be captured.", flags };
  }
  for (const { item_id, capture } of input.captures) {
    const err = validateCapture(item_id, capture);
    if (err) return { ok: false, reason: `${item_id}: ${err}`, flags };
  }

  if (!isInCalifornia(input.store_geocode.lat, input.store_geocode.lng)) {
    return { ok: false, reason: "Store must be in California.", flags };
  }

  if (input.session_time_seconds < SESSION_MIN_SECONDS) {
    return {
      ok: false,
      reason: `Audit was too quick (${input.session_time_seconds}s). Minimum is ${SESSION_MIN_SECONDS}s.`,
      flags,
    };
  }
  if (input.session_time_seconds > SESSION_MAX_SECONDS) {
    flags.push({
      flag_type: "session-too-long",
      flag_severity: "review",
      flag_reason: `Session exceeded ${SESSION_MAX_SECONDS}s — possible idle time.`,
    });
  }

  if (input.prior_audit_count_at_store_in_window > 0) {
    return {
      ok: false,
      reason: `You've already audited this store in the last ${ANTI_DUP_WINDOW_DAYS} days.`,
      flags,
    };
  }

  if (input.rapid_submission_count_last_hour > 3) {
    flags.push({
      flag_type: "rapid-submission-pattern",
      flag_severity: "review",
      flag_reason: `${input.rapid_submission_count_last_hour} submissions in the last hour.`,
    });
  }

  for (const { item_id, capture } of input.captures) {
    if (capture.stock_status !== "in-stock") continue;
    const item = findItem(item_id)!;
    if (
      capture.price_usd! < item.plausibility_band_usd_low ||
      capture.price_usd! > item.plausibility_band_usd_high
    ) {
      flags.push({
        flag_type: "price-outlier",
        flag_severity: "review",
        flag_reason: `${item.display_name} $${capture.price_usd!.toFixed(2)} outside expected $${item.plausibility_band_usd_low}–$${item.plausibility_band_usd_high}.`,
        metadata: { item_id, price_usd: capture.price_usd },
      });
    }
  }

  return { ok: true, flags };
}

const PII_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\b\d{3}-\d{2}-\d{4}\b/, label: "SSN" },
  { re: /\b(?:\d[ -]?){13,19}\b/, label: "payment card" },
  { re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/, label: "email address" },
];

export function detectPii(text: string): string | null {
  for (const { re, label } of PII_PATTERNS) {
    if (re.test(text)) return label;
  }
  return null;
}

/** Hours credited from measured session time, capped at SESSION_CAP_MINUTES. */
export function creditedHoursFromSeconds(seconds: number): number {
  const minutes = Math.max(0, seconds / 60);
  const capped = Math.min(minutes, SESSION_CAP_MINUTES);
  return Math.round((capped / 60) * 100) / 100;
}
