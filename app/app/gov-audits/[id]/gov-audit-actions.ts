"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";
import { requireUser } from "@/lib/session";
import { logError } from "@/lib/audit";
import { creditHoursStmt } from "@/lib/ledger";
import {
  runAutoChecksBatch,
  renderPagePreview,
  type PagePreviewResult,
} from "@/lib/gov-audit-browser";
import {
  ANCHOR_CAP_SECONDS,
  certifiedMinutes,
  classifyDevice,
  integrityScore,
  isOfficialDomain,
  isPageRubricComplete,
  navTrailEntry,
  stripUrl,
  urlDomain,
  INTEGRITY_FLAG_THRESHOLD,
  type AnchorCorroboration,
  type AnchorDraft,
  type GovAuditDraft,
  type GovAuditSessionRow,
  type Observable,
  type SitePassPartialFail,
} from "@/lib/gov-audit";

/** Session row incl. draft_json, ownership-checked. */
async function loadOwnedRaw(sessionId: string): Promise<(GovAuditSessionRow & { draft_json: string }) | null> {
  const user = await requireUser();
  const s = await getDb()
    .prepare("SELECT * FROM gov_audit_sessions WHERE id = ?")
    .bind(sessionId)
    .first<GovAuditSessionRow & { draft_json: string }>();
  if (!s || s.user_id !== user.id) return null;
  return s;
}

function parseDraft(row: { draft_json?: string } | null): GovAuditDraft {
  try {
    return JSON.parse(row?.draft_json ?? "{}") as GovAuditDraft;
  } catch {
    return {};
  }
}

async function saveDraft(sessionId: string, draft: GovAuditDraft): Promise<void> {
  await getDb()
    .prepare("UPDATE gov_audit_sessions SET draft_json = ? WHERE id = ? AND status = 'in_progress'")
    .bind(JSON.stringify(draft), sessionId)
    .run();
}

/** Persist the site-level rubric (answered once per session). */
export async function saveSiteEvalAction(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "");
  const row = (await loadOwnedRaw(sessionId)) as (GovAuditSessionRow & { draft_json: string }) | null;
  if (!row || row.status !== "in_progress") return;
  const draft = parseDraft(row);

  const ppf = (k: string): SitePassPartialFail | undefined => {
    const v = String(formData.get(k) ?? "");
    return ["pass", "partial", "fail", "cant_tell"].includes(v) ? (v as SitePassPartialFail) : undefined;
  };
  const bool = (k: string): boolean | undefined => {
    const v = formData.get(k);
    if (v == null) return undefined;
    return String(v) === "1" || String(v) === "true";
  };

  draft.site = {
    ...draft.site,
    site_domain: stripDomainInput(String(formData.get("site_domain") ?? draft.site?.site_domain ?? "")),
    official_domain: bool("official_domain") ?? draft.site?.official_domain,
    https: bool("https") ?? draft.site?.https,
    mobile_responsive: ppf("mobile_responsive") ?? draft.site?.mobile_responsive,
    language_access: bool("language_access") ?? draft.site?.language_access,
    site_search: ppf("site_search") ?? draft.site?.site_search,
    mobile_firsthand: bool("mobile_firsthand") ?? draft.site?.mobile_firsthand,
  };
  await saveDraft(sessionId, draft);
  revalidatePath(`/app/gov-audits/${sessionId}`);
}

function stripDomainInput(raw: string): string {
  const d = urlDomain(raw.startsWith("http") ? raw : `https://${raw}`);
  return d || raw.trim().toLowerCase();
}

/**
 * Lock an anchor: the volunteer navigated to the assigned target and pins it.
 * Strips the URL (no query strings), records anchor_set_at, derives the site
 * domain + official-domain hint if not already set. Returns the anchor id.
 */
export async function setAnchorAction(formData: FormData): Promise<{ ok: boolean; anchorId?: string; error?: string }> {
  const sessionId = String(formData.get("session_id") ?? "");
  const rawUrl = String(formData.get("url") ?? "");
  const pageTitle = String(formData.get("page_title") ?? "").trim() || undefined;
  const row = (await loadOwnedRaw(sessionId)) as (GovAuditSessionRow & { draft_json: string }) | null;
  if (!row || row.status !== "in_progress") return { ok: false, error: "Session not editable." };

  const url = stripUrl(rawUrl);
  if (!url || !/^https?:\/\//.test(url)) return { ok: false, error: "Enter the full page URL (https://…)." };

  // One audit per (user, url). The public cluster is append-only on
  // finalize, so a second audit of the same URL by the same person would just
  // duplicate the row. Catch at lock-time so the volunteer doesn't sink time
  // into a rubric they can't submit.
  const prior = await getDb()
    .prepare(
      `SELECT p.url
       FROM gov_audit_page_evaluations p
       JOIN gov_audit_sessions s ON s.public_session_ref = p.public_session_ref
       WHERE s.user_id = ? AND p.url = ? AND s.status IN ('submitted','flagged','finalized')
       LIMIT 1`
    )
    .bind(row.user_id, url)
    .first<{ url: string }>();
  if (prior) {
    return {
      ok: false,
      error: "You've already audited this page. Pick a different URL to add another row to the public dataset.",
    };
  }

  const draft = parseDraft(row);
  draft.anchors = draft.anchors ?? {};
  draft.anchor_order = draft.anchor_order ?? [];

  // Reuse an existing anchor with the same stripped URL rather than duplicating.
  let anchorId = Object.keys(draft.anchors).find((id) => draft.anchors![id].url === url);
  const now = Date.now();
  if (!anchorId) {
    anchorId = newId("anchor");
    draft.anchors[anchorId] = {
      url,
      page_title: pageTitle,
      anchor_set_at: now,
      time_on_anchor_sec: 0,
      nav_trail: [navTrailEntry(rawUrl, now)],
    };
    draft.anchor_order.push(anchorId);
  } else if (pageTitle) {
    draft.anchors[anchorId].page_title = pageTitle;
  }

  // Seed site domain from the first anchor if the volunteer hasn't set it.
  if (!draft.site?.site_domain) {
    const host = urlDomain(url);
    draft.site = {
      ...draft.site,
      site_domain: host,
      official_domain: draft.site?.official_domain ?? isOfficialDomain(host),
      https: draft.site?.https ?? url.startsWith("https://"),
    };
  }

  await saveDraft(sessionId, draft);
  revalidatePath(`/app/gov-audits/${sessionId}`);
  return { ok: true, anchorId };
}

/**
 * Render a server-side preview (screenshot via Browser Rendering, or metadata-
 * only fetch fallback) for the in-task embed. Also appends the resolved URL to
 * the active anchor's nav-trail when an anchor id is supplied, so browsing is
 * logged as findability metadata + a fraud signal.
 */
export async function previewPageAction(formData: FormData): Promise<PagePreviewResult & { error?: string }> {
  const sessionId = String(formData.get("session_id") ?? "");
  const rawUrl = String(formData.get("url") ?? "");
  const anchorId = String(formData.get("anchor_id") ?? "");
  const row = await loadOwnedRaw(sessionId);
  if (!row) {
    return { url: "", resolved_url: "", page_title: null, http_status: null, load_ok: false, screenshot_b64: null, mode: "fetch_only", error: "Not found." };
  }
  const preview = await renderPagePreview(rawUrl);

  // Log the visit to the active anchor's trail (domain+path only).
  if (anchorId && preview.resolved_url && row.status === "in_progress") {
    const draft = parseDraft(row);
    const anchor = draft.anchors?.[anchorId];
    if (anchor) {
      const entry = navTrailEntry(preview.resolved_url, Date.now());
      const last = anchor.nav_trail[anchor.nav_trail.length - 1];
      if (entry.url && (!last || last.url !== entry.url)) {
        anchor.nav_trail.push(entry);
        await saveDraft(sessionId, draft);
      }
    }
  }
  return preview;
}

/** Append a stripped domain+path entry to an anchor's nav-trail if it changed.
 *  Returns true when the draft was mutated (caller persists). */
function logTrail(draft: GovAuditDraft, anchorId: string, resolvedUrl: string): boolean {
  if (!anchorId || !resolvedUrl) return false;
  const anchor = draft.anchors?.[anchorId];
  if (!anchor) return false;
  const entry = navTrailEntry(resolvedUrl, Date.now());
  if (!entry.url) return false;
  const last = anchor.nav_trail[anchor.nav_trail.length - 1];
  if (last && last.url === entry.url) return false;
  anchor.nav_trail.push(entry);
  return true;
}

/** Append a domain+path nav-trail entry (query strings stripped). Fraud signal +
 *  findability metadata. */
export async function appendNavTrailAction(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "");
  const anchorId = String(formData.get("anchor_id") ?? "");
  const rawUrl = String(formData.get("url") ?? "");
  const row = (await loadOwnedRaw(sessionId)) as (GovAuditSessionRow & { draft_json: string }) | null;
  if (!row || row.status !== "in_progress") return;
  const draft = parseDraft(row);
  const anchor = draft.anchors?.[anchorId];
  if (!anchor) return;
  const entry = navTrailEntry(rawUrl, Date.now());
  if (!entry.url) return;
  // De-dupe consecutive identical paths to keep the trail compact.
  const last = anchor.nav_trail[anchor.nav_trail.length - 1];
  if (!last || last.url !== entry.url) anchor.nav_trail.push(entry);
  await saveDraft(sessionId, draft);
}

/** Upsert the page-level rubric for one anchor. Called on field blur (autosave). */
export async function savePageEvalAction(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "");
  const anchorId = String(formData.get("anchor_id") ?? "");
  const row = (await loadOwnedRaw(sessionId)) as (GovAuditSessionRow & { draft_json: string }) | null;
  if (!row || row.status !== "in_progress") return;
  const draft = parseDraft(row);
  const anchor = draft.anchors?.[anchorId];
  if (!anchor) return;

  const obs = (k: string): Observable | undefined => {
    const v = String(formData.get(k) ?? "");
    return ["pass", "partial", "fail", "cant_tell"].includes(v) ? (v as Observable) : undefined;
  };
  const likert = (k: string): number | undefined => {
    const n = Number(formData.get(k) ?? NaN);
    return Number.isInteger(n) && n >= 1 && n <= 5 ? n : undefined;
  };
  const text = (k: string): string | undefined => {
    const v = formData.get(k);
    return v == null ? undefined : String(v).slice(0, 2000);
  };

  const merge = <T,>(next: T | undefined, prev: T | undefined): T | undefined => (next === undefined ? prev : next);

  anchor.accessibility = merge(obs("accessibility"), anchor.accessibility);
  anchor.acc_alt_text = merge(obs("acc_alt_text"), anchor.acc_alt_text);
  anchor.acc_keyboard_nav = merge(obs("acc_keyboard_nav"), anchor.acc_keyboard_nav);
  anchor.acc_contrast = merge(obs("acc_contrast"), anchor.acc_contrast);
  anchor.acc_zoom_200 = merge(obs("acc_zoom_200"), anchor.acc_zoom_200);
  anchor.task_completion = merge(obs("task_completion"), anchor.task_completion);
  anchor.maintained = merge(obs("maintained"), anchor.maintained);
  anchor.nav_1to5 = merge(likert("nav_1to5"), anchor.nav_1to5);
  anchor.clarity_1to5 = merge(likert("clarity_1to5"), anchor.clarity_1to5);
  anchor.trust_1to5 = merge(likert("trust_1to5"), anchor.trust_1to5);
  anchor.overall_1to5 = merge(likert("overall_1to5"), anchor.overall_1to5);
  anchor.intent_text = merge(text("intent_text"), anchor.intent_text);
  anchor.blocker_text = merge(text("blocker_text"), anchor.blocker_text);
  anchor.fix_text = merge(text("fix_text"), anchor.fix_text);

  const addSec = Math.max(0, Math.floor(Number(formData.get("add_seconds") ?? 0)));
  if (addSec > 0) anchor.time_on_anchor_sec = (anchor.time_on_anchor_sec ?? 0) + addSec;

  await saveDraft(sessionId, draft);
  revalidatePath(`/app/gov-audits/${sessionId}`);
}

/** Cancel an unsubmitted gov-audit — clears the private session and its still-open
 *  submission. No public rows exist yet (materialized only on finalize) and no
 *  hours were credited, so nothing to orphan or claw back. */
export async function cancelGovAuditAction(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "");
  const s = await loadOwnedRaw(sessionId);
  if (!s) redirect("/app");
  if (s!.status !== "in_progress") redirect(`/app/gov-audits/${sessionId}`);
  const db = getDb();
  await db.prepare("DELETE FROM gov_audit_sessions WHERE id = ?").bind(sessionId).run();
  await db.prepare("DELETE FROM submissions WHERE id = ?").bind(s!.submission_id).run();
  revalidatePath("/app");
  redirect("/app");
}

export async function submitGovAuditAction(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "");
  try {
    return await submitInner(formData, sessionId);
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    await logError("submitGovAuditAction", err, { sessionId });
    return { ok: false, error: "Couldn't submit the audit. The error is logged — try again." };
  }
}

async function submitInner(formData: FormData, sessionId: string) {
  const row = (await loadOwnedRaw(sessionId)) as (GovAuditSessionRow & { draft_json: string }) | null;
  if (!row) redirect("/app/tasks");
  if (row!.status !== "in_progress") redirect(`/app/gov-audits/${sessionId}/done`);

  const draft = parseDraft(row);
  const anchorIds = draft.anchor_order ?? Object.keys(draft.anchors ?? {});
  if (anchorIds.length === 0) {
    return { ok: false, error: "Lock the assigned page as your anchor before submitting." };
  }
  // Require a completed page rubric on at least one anchor.
  const completeAnchors = anchorIds.filter((id) => {
    const a = draft.anchors?.[id];
    return a && isPageRubricComplete(a as unknown as Record<string, unknown>);
  });
  if (completeAnchors.length === 0) {
    return { ok: false, error: "Answer every observable and 1–5 rating on the page before submitting." };
  }

  const db = getDb();
  const now = Date.now();
  const ref = row!.public_session_ref;

  // Materialize the public page_evaluations rows synchronously. Auto-checks
  // (Browser Rendering + axe-core) are deferred into ctx.waitUntil() below —
  // they take 15–30s per anchor and would otherwise blow Workers' wall-clock
  // budget, leaving the volunteer staring at a stuck "Submitting…" button.
  // Rubric-only corroboration is computed now; the score is recomputed once
  // auto-checks land.
  const corroborations: AnchorCorroboration[] = [];
  for (const id of anchorIds) {
    const a = draft.anchors![id];
    const rubricComplete = isPageRubricComplete(a as unknown as Record<string, unknown>);
    corroborations.push({
      accessibility: a.accessibility ?? null,
      axeViolations: null, // unknown until the background auto-check lands
      loadOk: null,
      rubricComplete,
    });

    // Materialize the public page_evaluations row (append-only on finalize).
    await db
      .prepare(
        `INSERT INTO gov_audit_page_evaluations
         (id, public_session_ref, url, url_domain, page_title, time_on_anchor_sec, anchor_set_at,
          accessibility, acc_alt_text, acc_keyboard_nav, acc_contrast, acc_zoom_200, task_completion, maintained,
          nav_1to5, clarity_1to5, trust_1to5, overall_1to5,
          intent_text, blocker_text, fix_text, text_moderation_status, nav_trail_json, created_at)
         VALUES (?,?,?,?,?,?,?, ?,?,?,?,?,?,?, ?,?,?,?, ?,?,?, 'pending', ?, ?)`
      )
      .bind(
        newId("pageeval"),
        ref,
        a.url,
        urlDomain(a.url),
        a.page_title ?? null,
        Math.min(a.time_on_anchor_sec ?? 0, ANCHOR_CAP_SECONDS),
        a.anchor_set_at ?? now,
        a.accessibility ?? null,
        a.acc_alt_text ?? null,
        a.acc_keyboard_nav ?? null,
        a.acc_contrast ?? null,
        a.acc_zoom_200 ?? null,
        a.task_completion ?? null,
        a.maintained ?? null,
        a.nav_1to5 ?? null,
        a.clarity_1to5 ?? null,
        a.trust_1to5 ?? null,
        a.overall_1to5 ?? null,
        a.intent_text ?? null,
        a.blocker_text ?? null,
        a.fix_text ?? null,
        JSON.stringify(a.nav_trail ?? []),
        now
      )
      .run();
  }

  // Snapshot the anchor URLs the background job will check.
  const anchorUrlsForCheck = anchorIds.map((id) => ({
    url: draft.anchors![id].url,
    accessibility: draft.anchors![id].accessibility ?? null,
    rubricComplete: isPageRubricComplete(draft.anchors![id] as unknown as Record<string, unknown>),
  }));

  // Materialize the single public site_evaluations row.
  const site = draft.site ?? {};
  const siteDomain = site.site_domain || urlDomain(draft.anchors![anchorIds[0]].url);
  await db
    .prepare(
      `INSERT INTO gov_audit_site_evaluations
       (id, public_session_ref, site_domain, official_domain, https, mobile_responsive, language_access, site_search, mobile_firsthand, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    )
    .bind(
      newId("siteeval"),
      ref,
      siteDomain,
      boolToInt(site.official_domain),
      boolToInt(site.https),
      site.mobile_responsive ?? null,
      boolToInt(site.language_access),
      site.site_search ?? null,
      boolToInt(site.mobile_firsthand),
      now
    )
    .run();

  // Derive certification figures.
  const certMin = certifiedMinutes(
    anchorIds.map((id) => ({
      time_on_anchor_sec: draft.anchors![id].time_on_anchor_sec ?? 0,
      rubricComplete: isPageRubricComplete(draft.anchors![id] as unknown as Record<string, unknown>),
    }))
  );
  const integrity = integrityScore(corroborations);

  // Desktop-only enforcement (PRD §11 P0): non-desktop sessions certify zero and
  // are flagged. Low integrity also flags for human review.
  const isDesktop = row!.device === "desktop";
  const flagged = !isDesktop || integrity < INTEGRITY_FLAG_THRESHOLD;
  const finalCertMin = isDesktop ? certMin : 0;

  await db
    .prepare(
      `UPDATE gov_audit_sessions
       SET status = ?, submitted_at = ?, certified_minutes = ?, integrity_score = ?, draft_json = '{}'
       WHERE id = ?`
    )
    .bind(flagged ? "flagged" : "submitted", now, finalCertMin, integrity, sessionId)
    .run();

  // Route the submission into the existing review queue. Reviewer approve credits
  // hours_ledger (see adminApproveGovAuditAction), mirroring the food-audit model
  // where the ledger is written on approval, never on raw time logged.
  await db
    .prepare(
      `UPDATE submissions
       SET status = ?, submitted_at = ?, measured_active_seconds = ?
       WHERE id = ?`
    )
    .bind(flagged ? "needs_changes" : "pending_review", now, finalCertMin * 60, row!.submission_id)
    .run();

  // Kick off the slow server-side auto-checks in the background so the submit
  // request returns immediately. waitUntil lets the worker keep running for up
  // to ~30s after the response — plenty for one or two anchor's axe-core runs.
  // If the worker dies before the checks finish, axe_violations stays null
  // (treated as neutral by integrityScore) — never penalises the volunteer.
  try {
    getCloudflareContext().ctx.waitUntil(
      runGovAuditAutoChecks(sessionId, ref, anchorUrlsForCheck, row!.device === "desktop")
    );
  } catch {
    /* outside Workers runtime — auto-check just doesn't run */
  }

  redirect(`/app/gov-audits/${sessionId}/done`);
}

/**
 * Background auto-check pipeline. For each anchor URL:
 *  1. runAutoCheck (HTTPS / HTTP status / load / axe-core)
 *  2. Insert the gov_audit_auto_checks row
 *  3. Recompute integrity_score from the rubric + real corroboration; update
 *     the session row.
 *
 * This runs via ctx.waitUntil after the submit response has been sent, so the
 * volunteer is already on /done by the time it starts. Never throws — failures
 * leave axe_violations null, which integrityScore treats as neutral.
 */
async function runGovAuditAutoChecks(
  sessionId: string,
  ref: string,
  anchors: { url: string; accessibility: Observable | null; rubricComplete: boolean }[],
  isDesktop: boolean
): Promise<void> {
  const db = getDb();
  const now = Date.now();
  const corroborations: AnchorCorroboration[] = [];

  // Cap auto-checks per run to fit the waitUntil wall-clock budget (each
  // Browser Rendering + axe-core pass is 15–30s). Anchors beyond the cap leave
  // axe_violations null, which integrityScore treats as neutral — never a
  // penalty. (Browser reuse is handled in gov-audit-browser.ts.)
  const MAX_ANCHORS_PER_RUN = 3;
  if (anchors.length > MAX_ANCHORS_PER_RUN) {
    await logError("runGovAuditAutoChecks:anchorCap", new Error("anchor cap hit"), {
      sessionId,
      total: anchors.length,
      cap: MAX_ANCHORS_PER_RUN,
    });
  }
  const cappedAnchors = anchors.slice(0, MAX_ANCHORS_PER_RUN);

  // Single Browser Rendering session for all anchors (one launch/close), instead
  // of one session per anchor. runAutoChecksBatch never throws and returns
  // results in input order; binding is left undefined so the helper resolves the
  // BROWSER binding itself (same binding the per-URL path used) and degrades to
  // fetch when it's absent.
  const checks = await runAutoChecksBatch(undefined, cappedAnchors.map((a) => a.url));

  for (let i = 0; i < cappedAnchors.length; i++) {
    const a = cappedAnchors[i];
    const check = checks[i];

    try {
      await db
        .prepare(
          `INSERT INTO gov_audit_auto_checks
           (id, public_session_ref, url, https_ok, http_status, load_ok, axe_violations, axe_summary_json, check_mode, checked_at)
           VALUES (?,?,?,?,?,?,?,?,?,?)`
        )
        .bind(
          newId("autochk"),
          ref,
          check.url,
          check.https_ok ? 1 : 0,
          check.http_status,
          check.load_ok ? 1 : 0,
          check.axe_violations,
          check.axe_summary ? JSON.stringify(check.axe_summary) : null,
          check.check_mode,
          now
        )
        .run();
    } catch (err) {
      await logError("runGovAuditAutoChecks:insertCheck", err, { sessionId, url: a.url });
    }

    corroborations.push({
      accessibility: a.accessibility,
      axeViolations: check.axe_violations,
      loadOk: check.load_ok,
      rubricComplete: a.rubricComplete,
    });
  }

  // Recompute integrity_score with real corroboration; preserve flagged status
  // unless the new integrity now meets the threshold (and the volunteer was on
  // a desktop). Never downgrade a session that's already been admin-handled.
  try {
    const newIntegrity = integrityScore(corroborations);
    const shouldFlag = !isDesktop || newIntegrity < INTEGRITY_FLAG_THRESHOLD;
    await db
      .prepare(
        `UPDATE gov_audit_sessions
         SET integrity_score = ?, status = CASE WHEN status IN ('submitted','flagged') THEN ? ELSE status END
         WHERE id = ?`
      )
      .bind(newIntegrity, shouldFlag ? "flagged" : "submitted", sessionId)
      .run();
  } catch (err) {
    await logError("runGovAuditAutoChecks:updateIntegrity", err, { sessionId });
  }
}

function boolToInt(v: boolean | undefined): number | null {
  return v === undefined ? null : v ? 1 : 0;
}

/**
 * Admin action: approve a submitted gov-audit. Credits certified_minutes (as
 * hours) into hours_ledger, mirroring adminApproveAuditAction. The reviewer may
 * confirm but the credited number is the system-derived certified time, never a
 * raw timer.
 */
export async function adminApproveGovAuditAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/unauthorized");
  const sessionId = String(formData.get("session_id") ?? "");
  const db = getDb();
  const s = await db
    .prepare("SELECT * FROM gov_audit_sessions WHERE id = ?")
    .bind(sessionId)
    .first<GovAuditSessionRow>();
  if (!s) return;

  const credited = Math.round(((s.certified_minutes ?? 0) / 60) * 100) / 100;
  const now = Date.now();

  // Read the recipient before the batch so the ledger credit can ride along.
  const sub = await db
    .prepare("SELECT user_id FROM submissions WHERE id = ?")
    .bind(s.submission_id)
    .first<{ user_id: string }>();

  // The finalize, the irreversible submission status='approved' flip, and the
  // ledger credit commit together in one db.batch() (D1 implicit transaction).
  const batch: D1PreparedStatement[] = [
    db
      .prepare("UPDATE gov_audit_sessions SET status = 'finalized', finalized_at = ? WHERE id = ?")
      .bind(now, sessionId),
    db
      .prepare(
        `UPDATE submissions SET status = 'approved', reviewer_id = ?, reviewed_at = ?, hours_credited = ? WHERE id = ?`
      )
      .bind(user.id, now, credited, s.submission_id),
  ];
  if (sub?.user_id && credited > 0) {
    batch.push(creditHoursStmt(db, { userId: sub.user_id, hours: credited, certifiedOrgId: "org_gov_digital" }));
  }
  await db.batch(batch);
  revalidatePath("/admin/audits");
}

/**
 * Right to erasure (PRD §9): delete the PRIVATE session row only. The public
 * page/site/auto-check rows orphan under a ref that now maps to no user — the
 * work product survives, the link to a person is gone. We deliberately do NOT
 * delete the public rows.
 */
export async function eraseGovAuditSessionAction(formData: FormData) {
  const user = await requireUser();
  const sessionId = String(formData.get("session_id") ?? "");
  const s = await getDb()
    .prepare("SELECT * FROM gov_audit_sessions WHERE id = ?")
    .bind(sessionId)
    .first<GovAuditSessionRow>();
  if (!s) return;
  if (s.user_id !== user.id && user.role !== "admin") redirect("/unauthorized");
  await getDb().prepare("DELETE FROM gov_audit_sessions WHERE id = ?").bind(sessionId).run();
  revalidatePath("/app");
}
