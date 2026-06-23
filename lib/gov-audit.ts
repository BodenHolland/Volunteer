/**
 * Government Website Audit — domain types, rubric config, scoring, URL hygiene.
 *
 * Companion to migration 0013_gov_audit.sql. The dual-cluster privacy model
 * lives in the schema; this module holds the shared shapes + the pure functions
 * the server actions and export endpoints both rely on.
 *
 * DATA PRINCIPLE: nothing here ever moves PII into the public cluster. The only
 * cross-boundary value is public_session_ref (an opaque per-session UUID).
 */

// ---------- Certification constants (PRD §4.4) ----------

/** Per-anchor certification cap. Time past this adds no certified minutes —
 *  kills the park-for-two-hours exploit. It is a CAP + soft pacing warning,
 *  never a hard mid-rubric cutoff. 20 min gives a thorough auditor room to
 *  click through every image, table, and PDF on a complex page. */
export const ANCHOR_CAP_SECONDS = 1200; // 20 minutes

/** Soft pacing warning fires at this elapsed time on an anchor. */
export const ANCHOR_SOFT_WARN_SECONDS = 1200;

// ---------- Rubric vocab ----------

export type Observable = "pass" | "partial" | "fail" | "cant_tell";
export type SitePassPartialFail = "pass" | "partial" | "fail" | "cant_tell";

export const OBSERVABLE_VALUES: Observable[] = ["pass", "partial", "fail", "cant_tell"];

export const OBSERVABLE_LABELS: Record<Observable, string> = {
  pass: "Pass",
  partial: "Partial",
  fail: "Fail",
  cant_tell: "Can't tell / N/A",
};

/** Likert ends are labelled with concrete words, never bare numbers (PRD §5.3). */
export interface LikertSpec {
  id: "nav_1to5" | "clarity_1to5" | "trust_1to5" | "overall_1to5";
  prompt: string;
  low: string;
  high: string;
}

export const LIKERT_ITEMS: LikertSpec[] = [
  { id: "nav_1to5", prompt: "Ease of navigation", low: "Got lost", high: "Effortless" },
  { id: "clarity_1to5", prompt: "Clarity of language", low: "Confusing jargon", high: "Plain and clear" },
  { id: "trust_1to5", prompt: "Looks trustworthy / professional", low: "Sketchy", high: "Clearly official" },
  { id: "overall_1to5", prompt: "Overall page quality", low: "Poor", high: "Excellent" },
];

/** Observable page items, each with a one-line inline micro-instruction — the
 *  primary teaching surface (PRD §4.5). The 4 accessibility sub-checks are the
 *  legal core (Section 508 / ADA). */
export interface ObservableItemSpec {
  id:
    | "acc_alt_text"
    | "acc_keyboard_nav"
    | "acc_contrast"
    | "acc_zoom_200"
    | "task_completion"
    | "maintained";
  label: string;
  help: string;
  group: "accessibility" | "page";
}

export const OBSERVABLE_ITEMS: ObservableItemSpec[] = [
  {
    id: "acc_alt_text",
    label: "Images have meaningful alt text",
    help: "Right-click an image → Inspect. Look for alt=\"…\" that describes the image. Decorative images may have empty alt; photos that carry meaning should not.",
    group: "accessibility",
  },
  {
    id: "acc_keyboard_nav",
    label: "Keyboard reaches every control",
    help: "Press Tab repeatedly. Can you reach every link and button, and see where focus is? If anything is skipped or invisible, it's not Pass.",
    group: "accessibility",
  },
  {
    id: "acc_contrast",
    label: "Text contrast is readable",
    help: "Is body text easy to read against its background? Light grey on white, or text over a busy image, usually fails.",
    group: "accessibility",
  },
  {
    id: "acc_zoom_200",
    label: "Zooms to ~200% without breaking",
    help: "Press Ctrl/Cmd + a few times to ~200%. Does content reflow and stay usable, or does text get cut off / overlap?",
    group: "accessibility",
  },
  {
    id: "task_completion",
    label: "Primary action is clear",
    help: "Is the main thing a resident comes here to do (apply, find info, pay) clearly present and findable?",
    group: "page",
  },
  {
    id: "maintained",
    label: "Page looks maintained",
    help: "Do links resolve without errors, and does the content look current rather than abandoned?",
    group: "page",
  },
];

export const FREE_TEXT_ITEMS: { id: "intent_text" | "blocker_text" | "fix_text"; prompt: string }[] = [
  { id: "intent_text", prompt: "What were you trying to do on this page?" },
  { id: "blocker_text", prompt: "What got in the way?" },
  { id: "fix_text", prompt: "One concrete fix you'd recommend." },
];

// ---------- DB row types ----------

export type GovAuditDevice = "desktop" | "mobile" | "tablet" | "unknown";
export type GovAuditStatus = "in_progress" | "submitted" | "finalized" | "flagged";

export interface GovAuditSessionRow {
  id: string;
  user_id: string;
  submission_id: string;
  task_template_id: string;
  device: GovAuditDevice;
  public_session_ref: string;
  status: GovAuditStatus;
  started_at: number;
  submitted_at: number | null;
  finalized_at: number | null;
  certified_minutes: number | null;
  integrity_score: number | null;
  target_descriptor: string;
}

export interface GovAuditSiteEvalRow {
  id: string;
  public_session_ref: string;
  site_domain: string;
  official_domain: number | null;
  https: number | null;
  mobile_responsive: SitePassPartialFail | null;
  language_access: number | null;
  site_search: SitePassPartialFail | null;
  mobile_firsthand: number | null;
  created_at: number;
}

export interface GovAuditPageEvalRow {
  id: string;
  public_session_ref: string;
  url: string;
  url_domain: string;
  page_title: string | null;
  time_on_anchor_sec: number | null;
  anchor_set_at: number | null;
  accessibility: Observable | null;
  acc_alt_text: Observable | null;
  acc_keyboard_nav: Observable | null;
  acc_contrast: Observable | null;
  acc_zoom_200: Observable | null;
  task_completion: Observable | null;
  maintained: Observable | null;
  nav_1to5: number | null;
  clarity_1to5: number | null;
  trust_1to5: number | null;
  overall_1to5: number | null;
  intent_text: string | null;
  blocker_text: string | null;
  fix_text: string | null;
  text_moderation_status: "pending" | "approved" | "rejected";
  nav_trail_json: string | null;
  created_at: number;
}

export interface GovAuditAutoCheckRow {
  id: string;
  public_session_ref: string;
  url: string;
  https_ok: number | null;
  http_status: number | null;
  load_ok: number | null;
  axe_violations: number | null;
  axe_summary_json: string | null;
  check_mode: "browser_rendering" | "fetch_only" | "skipped";
  checked_at: number;
}

// ---------- Working draft shape (private cluster, migration 0014) ----------

/** Site-level rubric answers (answered once per session). */
export interface SiteEvalDraft {
  site_domain?: string;
  official_domain?: boolean;
  https?: boolean;
  mobile_responsive?: SitePassPartialFail;
  language_access?: boolean;
  site_search?: SitePassPartialFail;
  mobile_firsthand?: boolean;
}

/** One anchor's working state. Public-cluster rows are derived from this on
 *  finalize. */
export interface AnchorDraft {
  url: string; // stripped (origin+path)
  page_title?: string;
  anchor_set_at: number;
  /** Client-measured active seconds on this anchor; capped at finalize. */
  time_on_anchor_sec: number;
  nav_trail: { url: string; domain: string; at: number }[];
  // observable
  accessibility?: Observable;
  acc_alt_text?: Observable;
  acc_keyboard_nav?: Observable;
  acc_contrast?: Observable;
  acc_zoom_200?: Observable;
  task_completion?: Observable;
  maintained?: Observable;
  // experiential
  nav_1to5?: number;
  clarity_1to5?: number;
  trust_1to5?: number;
  overall_1to5?: number;
  // free text
  intent_text?: string;
  blocker_text?: string;
  fix_text?: string;
}

export interface GovAuditDraft {
  site?: SiteEvalDraft;
  anchors?: Record<string, AnchorDraft>;
  anchor_order?: string[];
  /** Active Cloudflare Browser Rendering session id for the interactive embed.
   *  Issued by startEmbed; validated on each interaction so a client can't drive
   *  a session we didn't open for this audit. */
  embed_session_id?: string;
}

// ---------- URL hygiene (PRD §4.2, §9) ----------

/**
 * Strip query string AND fragment from a URL before persisting. Gov search /
 * lookup URLs can carry typed names and addresses in params — those must never
 * reach the public cluster. Returns the origin+path only. Falsy / unparseable
 * input returns "".
 */
export function stripUrl(raw: string | null | undefined): string {
  if (!raw) return "";
  try {
    const u = new URL(raw);
    return `${u.origin}${u.pathname}`.replace(/\/$/, "") || u.origin;
  } catch {
    // Not an absolute URL — strip anything after ? or # manually.
    return raw.split(/[?#]/)[0];
  }
}

/** Registrable-ish domain for grouping. Returns hostname without leading www. */
export function urlDomain(raw: string | null | undefined): string {
  if (!raw) return "";
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Is this an official government host? .gov, .mil, .us, or a us state equiv. */
export function isOfficialDomain(host: string): boolean {
  const h = host.toLowerCase().replace(/^www\./, "");
  return /\.(gov|mil)$/.test(h) || /\.us$/.test(h);
}

/** Build a nav-trail entry: domain + path only, query string stripped. */
export function navTrailEntry(rawUrl: string, at: number): { url: string; domain: string; at: number } {
  return { url: stripUrl(rawUrl), domain: urlDomain(rawUrl), at };
}

// ---------- Certification + integrity scoring (PRD §4.4, §6, §9) ----------

/** A page evaluation's rubric is "complete" when every observable + every
 *  Likert item is answered (free text is optional / moderated separately). This
 *  is the gate for certifying that anchor's time. */
export function isPageRubricComplete(p: Partial<GovAuditPageEvalRow>): boolean {
  const observables: (keyof GovAuditPageEvalRow)[] = [
    "accessibility",
    "acc_alt_text",
    "acc_keyboard_nav",
    "acc_contrast",
    "acc_zoom_200",
    "task_completion",
    "maintained",
  ];
  for (const k of observables) {
    if (!p[k]) return false;
  }
  const likerts: (keyof GovAuditPageEvalRow)[] = ["nav_1to5", "clarity_1to5", "trust_1to5", "overall_1to5"];
  for (const k of likerts) {
    const v = p[k] as number | null | undefined;
    if (v == null || v < 1 || v > 5) return false;
  }
  return true;
}

/**
 * certified_minutes = Σ over anchors of min(time_on_anchor_sec, ANCHOR_CAP_SECONDS) / 60,
 * counting ONLY anchors whose page rubric is complete. Floored to whole
 * minutes. Non-desktop or flagged sessions certify 0 (enforced by caller).
 */
export function certifiedMinutes(
  pages: { time_on_anchor_sec: number | null; rubricComplete: boolean }[]
): number {
  let totalSec = 0;
  for (const p of pages) {
    if (!p.rubricComplete) continue;
    totalSec += Math.min(Math.max(0, p.time_on_anchor_sec ?? 0), ANCHOR_CAP_SECONDS);
  }
  return Math.floor(totalSec / 60);
}

export interface AnchorCorroboration {
  /** Volunteer's accessibility rating for the anchor. */
  accessibility: Observable | null;
  /** axe-core total violations from the server-side auto-check, or null if the
   *  auto-check couldn't run (no browser, fetch-only). */
  axeViolations: number | null;
  /** HTTP load succeeded server-side. */
  loadOk: boolean | null;
  rubricComplete: boolean;
}

/**
 * integrity_score ∈ [0,1] — blends rubric completeness with auto-check
 * corroboration (PRD §6, §9). Exact weights are an open question (Q3); this is
 * a defensible v1:
 *
 *   0.5 × (fraction of anchors with a complete rubric)
 * + 0.5 × (mean per-anchor corroboration)
 *
 * Per-anchor corroboration starts at 1.0 and is penalised when the volunteer's
 * self-report contradicts ground truth — e.g. rates accessibility "pass" while
 * axe-core flags many violations. A missing auto-check is neutral (no penalty,
 * no bonus), so the score never punishes a volunteer for our infra gap.
 */
export function integrityScore(anchors: AnchorCorroboration[]): number {
  if (anchors.length === 0) return 0;

  const completeFrac = anchors.filter((a) => a.rubricComplete).length / anchors.length;

  let corroborationSum = 0;
  for (const a of anchors) {
    let c = 1;
    if (a.loadOk === false) {
      // Page didn't load server-side but volunteer rated it — soft penalty.
      c -= 0.2;
    }
    if (a.axeViolations != null && a.accessibility === "pass" && a.axeViolations >= 10) {
      // Self-report "pass" contradicted by many automated violations.
      c -= 0.5;
    } else if (a.axeViolations != null && a.accessibility === "pass" && a.axeViolations >= 3) {
      c -= 0.25;
    }
    corroborationSum += Math.max(0, c);
  }
  const corroborationMean = corroborationSum / anchors.length;

  const score = 0.5 * completeFrac + 0.5 * corroborationMean;
  return Math.round(score * 100) / 100;
}

/** Sessions below this integrity score are auto-flagged for human review. */
export const INTEGRITY_FLAG_THRESHOLD = 0.6;

// ---------- Device classification (PRD §11 P0: desktop-only) ----------

/** Coarse device class from a user-agent string. Desktop-only is required to
 *  certify because keyboard-nav / 200%-zoom / contrast checks need a real
 *  keyboard and viewport (PRD §3, §11). */
export function classifyDevice(userAgent: string | null | undefined): GovAuditDevice {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry|bb10|opera mini/.test(ua)) return "mobile";
  return "desktop";
}
