// Domain types mirroring the D1 schema + the JSON column shapes.

export type Role = "recipient" | "org_member" | "admin";
export type OrgRole = "reviewer" | "org_admin";
export type Intent = "snap_cert" | "casual_volunteer" | "other" | "n/a";
export type LocationKind = "online" | "in_person" | "hybrid";
export type TaskCategory =
  | "data-collection"
  | "translation"
  | "civic-input"
  | "neighborhood-writing"
  | "seminar"
  | "food-audit"
  | "gov-audit";

export type SubmissionStatus =
  | "committed"
  | "in_progress"
  | "submitted"
  | "ai_reviewing"
  | "pending_review"
  | "approved"
  | "rejected"
  | "needs_changes";

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  /** Forward-geocoded coordinates, set when the address is saved. Optional
   *  because legacy rows and addresses Nominatim couldn't resolve won't have
   *  them. Used to estimate round-trip commute distance to audit stores. */
  lat?: number;
  lng?: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

export interface DeliverableSpec {
  kind: TaskCategory;
  min_photos?: number;
  require_geotag?: boolean;
  min_words?: number;
  source_lang?: string;
  target_lang?: string;
  survey?: { id: string; question: string; kind: "rank" | "choice" | "text"; options?: string[] }[];
  require_prework?: boolean;
  require_postwork?: boolean;
  require_video?: boolean;
  basket_template_id?: string;
  /** gov-audit: plain-language description of the page the volunteer must find
   *  and audit (e.g. "the page where residents apply for SNAP"). */
  target_descriptor?: string;
  /** gov-audit: optional canonical URL hint for the assigned target. The
   *  volunteer still navigates freely to reach it; this only seeds the embed. */
  target_url?: string;
}

export interface TimeLogSession {
  start: number;
  end: number | null;
}
export type ChecklistProgress = Record<string, boolean>;

export interface Org {
  id: string;
  slug: string;
  name: string;
  ein: string | null;
  contact_email: string | null;
  logo_url: string | null;
  about_md: string | null;
  address_json: string | null;
  signing_authority_name: string | null;
  signing_authority_title: string | null;
  status: "pending" | "active" | "paused";
  is_fictional: number;
  created_at: number;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  org_role: OrgRole | null;
  full_name: string | null;
  city: string | null;
  state: string | null;
  intent: Intent;
  legal_name: string | null;
  case_number: string | null;
  address_json: string | null;
  dob: string | null;
  phone: string | null;
  phone_verified_at: number | null;
  benefitscal_screenshot_r2_key: string | null;
  benefitscal_verified_at: number | null;
  org_id: string | null;
  created_at: number;
  // auth (migration 0002)
  password_hash: string | null;
  email_verified_at: number | null;
  failed_login_count: number;
  locked_until: number | null;
  // account lifecycle (migration 0003)
  notify_prefs_json: string | null;
  deleted_at: number | null;
  // firebase auth link (migration 0005)
  firebase_uid: string | null;
}

export interface TaskTemplate {
  id: string;
  org_id: string;
  created_by_user_id: string | null;
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
  status: "draft" | "active" | "paused" | "archived";
  created_at: number;
  // 4-part beneficiary gate (migration 0003)
  gate_external_beneficiary: number;
  gate_genuine_need: number;
  gate_free_deliverable: number;
  gate_would_do_anyway: number;
  gate_reviewed_by: string | null;
  gate_reviewed_at: number | null;
}

export interface Submission {
  id: string;
  user_id: string;
  task_template_id: string;
  status: SubmissionStatus;
  committed_at: number;
  first_started_at: number | null;
  submitted_at: number | null;
  reviewed_at: number | null;
  time_log_json: string;
  checklist_progress_json: string;
  user_notes: string | null;
  ai_verdict_json: string | null;
  reviewer_id: string | null;
  reviewer_notes: string | null;
  hours_credited: number | null;
  // hours integrity (migration 0003)
  measured_active_seconds: number;
  idle_seconds: number;
  // deliverable distribution (migration 0004)
  published_at: number | null;
}

export interface SubmissionFile {
  id: string;
  submission_id: string;
  kind: string;
  r2_key: string;
  metadata_json: string | null;
}

export interface SubmissionFlagRow {
  id: string;
  submission_id: string;
  kind: "duplicate_image" | "likely_ai_content" | "geotag_mismatch" | "velocity_anomaly";
  severity: "warn" | "flag" | "block";
  evidence_json: string | null;
  created_at: number;
}

export interface HoursLedgerRow {
  id: string;
  user_id: string;
  month: string;
  total_hours: number;
  certified_org_id: string | null;
}

export interface Cf888Form {
  id: string;
  user_id: string;
  month: string;
  r2_key: string;
  generated_at: number;
}

export const MONTHLY_HOURS_TARGET = 80;

/** Parse helpers (defensive). */
export function parseJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export function totalLoggedHours(timeLog: TimeLogSession[]): number {
  const ms = timeLog.reduce((acc, s) => acc + (s.end && s.start ? s.end - s.start : 0), 0);
  return ms / 3_600_000;
}
