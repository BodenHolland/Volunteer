"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ANCHOR_CAP_SECONDS,
  FREE_TEXT_ITEMS,
  LIKERT_ITEMS,
  OBSERVABLE_ITEMS,
  OBSERVABLE_LABELS,
  OBSERVABLE_VALUES,
  isPageRubricComplete,
  type AnchorDraft,
  type GovAuditDraft,
  type GovAuditDevice,
  type Observable,
} from "@/lib/gov-audit";
import {
  cancelGovAuditAction,
  saveSiteEvalAction,
  savePageEvalAction,
  setAnchorAction,
  submitGovAuditAction,
} from "./gov-audit-actions";
import { GovAuditChooser } from "./gov-audit-chooser";
import { AuditPanel } from "./gov-audit-panel";
import { pickLocalSite } from "@/lib/gov-sites";

const SITE_PPF = ["pass", "partial", "fail", "cant_tell"] as const;
const PPF_LABEL: Record<string, string> = {
  pass: "Yes / Pass",
  partial: "Partial",
  fail: "No / Fail",
  cant_tell: "Can't tell",
};

export function GovAuditClient({
  sessionId,
  device,
  targetDescriptor,
  targetUrlHint,
  viewerCity,
  viewerState,
  draft: initialDraft,
}: {
  sessionId: string;
  device: GovAuditDevice;
  targetDescriptor: string;
  targetUrlHint: string;
  viewerCity: string | null;
  viewerState: string | null;
  draft: GovAuditDraft;
}) {
  const [draft, setDraft] = useState<GovAuditDraft>(initialDraft);
  const anchorIds = draft.anchor_order ?? Object.keys(draft.anchors ?? {});
  const anchorId = anchorIds[0] ?? null; // v1: single assigned target
  const anchor = anchorId ? draft.anchors?.[anchorId] ?? null : null;

  // The URL the volunteer is currently auditing. They drive the real page in a
  // new tab (no in-app browser); we just hold the URL, fetch a server-side
  // snapshot for visual reference, and let them lock it as their anchor.
  const [auditUrl, setAuditUrl] = useState<string>(anchor?.url ?? "");
  const [auditTitle, setAuditTitle] = useState<string | null>(anchor?.page_title ?? null);
  const [, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locking, setLocking] = useState(false);

  // Show the chooser first; once a URL is picked (or an anchor already exists),
  // the audit panel takes over.
  const [pickedUrl, setPickedUrl] = useState<string | null>(anchor?.url ?? null);

  function pickSiteToAudit(url: string) {
    setPickedUrl(url);
    setAuditUrl(url);
    setAuditTitle(null);
  }

  const isDesktop = device === "desktop";

  // ---- per-anchor time tracking (20-min soft certification cap) ----
  // The clock runs regardless of whether our tab is focused — auditing requires
  // looking at the live page in another tab, so penalizing tab-switches would
  // be hostile and dishonest. The 20-min cap + integrity score (rubric
  // completeness × axe-core corroboration) are the floor on integrity.
  const [elapsed, setElapsed] = useState(anchor?.time_on_anchor_sec ?? 0);
  const accumulatedRef = useRef(0); // unsaved seconds since last flush
  useEffect(() => {
    if (!anchorId) return;
    const t = setInterval(() => {
      setElapsed((e) => e + 1);
      accumulatedRef.current += 1;
    }, 1000);
    return () => clearInterval(t);
  }, [anchorId]);

  // Flush accumulated seconds to the server periodically.
  useEffect(() => {
    if (!anchorId) return;
    const t = setInterval(() => flushTime(), 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorId]);

  function flushTime() {
    const secs = accumulatedRef.current;
    if (!anchorId || secs <= 0) return;
    accumulatedRef.current = 0;
    const fd = new FormData();
    fd.set("session_id", sessionId);
    fd.set("anchor_id", anchorId);
    fd.set("add_seconds", String(secs));
    startTransition(() => {
      void savePageEvalAction(fd);
    });
  }

  // ---- anchor lock (uses the URL the volunteer entered / picked) ----
  const [lockError, setLockError] = useState<string | null>(null);
  async function lockAnchor() {
    const url = auditUrl.trim();
    if (!url) return;
    setLocking(true);
    setLockError(null);
    const fd = new FormData();
    fd.set("session_id", sessionId);
    fd.set("url", url);
    if (auditTitle) fd.set("page_title", auditTitle);
    const res = await setAnchorAction(fd);
    setLocking(false);
    if (res.ok && res.anchorId) {
      const newAnchor: AnchorDraft = {
        url: stripForDisplay(url),
        page_title: auditTitle ?? undefined,
        anchor_set_at: Date.now(),
        time_on_anchor_sec: 0,
        nav_trail: [],
      };
      setDraft((d) => ({
        ...d,
        anchors: { ...(d.anchors ?? {}), [res.anchorId!]: { ...(d.anchors?.[res.anchorId!] ?? newAnchor) } },
        anchor_order: d.anchor_order?.includes(res.anchorId!) ? d.anchor_order : [...(d.anchor_order ?? []), res.anchorId!],
      }));
    } else if (res.error) {
      setLockError(res.error);
    }
  }

  // ---- rubric autosave ----
  function patchAnchor(patch: Partial<AnchorDraft>) {
    if (!anchorId) return;
    setDraft((d) => ({
      ...d,
      anchors: { ...(d.anchors ?? {}), [anchorId]: { ...(d.anchors![anchorId]), ...patch } },
    }));
    const fd = new FormData();
    fd.set("session_id", sessionId);
    fd.set("anchor_id", anchorId);
    for (const [k, v] of Object.entries(patch)) {
      if (v != null) fd.set(k, String(v));
    }
    startTransition(() => {
      void savePageEvalAction(fd);
    });
  }

  function patchSite(patch: Record<string, string>) {
    setDraft((d) => ({ ...d, site: { ...d.site, ...coerceSite(patch) } }));
    const fd = new FormData();
    fd.set("session_id", sessionId);
    for (const [k, v] of Object.entries(patch)) fd.set(k, v);
    startTransition(() => {
      void saveSiteEvalAction(fd);
    });
  }

  const rubricComplete = anchor ? isPageRubricComplete(anchor as unknown as Record<string, unknown>) : false;

  async function submit() {
    if (!anchorId) return;
    flushTime();
    setSubmitting(true);
    setSubmitError(null);
    const fd = new FormData();
    fd.set("session_id", sessionId);
    try {
      const res = await submitGovAuditAction(fd);
      // On success the action redirects (we never get here). An error result
      // comes back as {ok:false,error}; a network/worker timeout returns
      // undefined — surface a retry message in both cases so the button
      // can't get stuck "Submitting…" forever.
      if (!res) {
        setSubmitError("Submit didn't go through. Check your connection and try again.");
        setSubmitting(false);
      } else if (!res.ok) {
        setSubmitError(res.error ?? "Couldn't submit.");
        setSubmitting(false);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Couldn't submit — try again.");
      setSubmitting(false);
    }
  }

  const overCap = elapsed >= ANCHOR_CAP_SECONDS;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-[28px] font-semibold leading-tight text-ink">{targetDescriptor}</h1>
        <p className="text-body">
          Pick any government, nonprofit, or public-service page worth auditing — your city site, a state agency, a
          public library, a community clinic. Open the page in a new tab and explore it in your real browser
          (you&apos;ll need native Tab and zoom for the accessibility checks), then come back here and answer the short
          rubric. Your timer keeps running while you switch between tabs.
        </p>
      </header>

      {!isDesktop && (
        <div className="rounded-md border border-brick bg-brick-subtle px-4 py-3 text-sm text-brick">
          This looks like a {device} device. Accessibility checks need a real keyboard and screen, so{" "}
          <strong>this session won&apos;t certify hours</strong>. Switch to a desktop or laptop to earn credit. You can
          still complete the audit — it just won&apos;t count.
        </div>
      )}

      {/* Pinned anchor bar */}
      {anchor && (
        <div className="sticky top-2 z-10 rounded-md border border-navy/30 bg-section px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-navy">Your anchor</p>
              <p className="truncate text-sm font-medium text-ink">{anchor.page_title || anchor.url}</p>
              <p className="truncate text-xs text-body">{anchor.url}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`text-sm tabular-nums ${overCap ? "text-terracotta" : "text-body"}`}>
                {fmt(elapsed)}
              </span>
              <Button asChild type="button" size="sm" variant="secondary">
                <a href={anchor.url} target="_blank" rel="noopener noreferrer">
                  Open in new tab ↗
                </a>
              </Button>
            </div>
          </div>
          {overCap && (
            <p className="mt-2 text-xs text-terracotta">
              You&apos;ve passed the 20-minute mark. Keep going if you need to — time past 20 minutes just doesn&apos;t
              add more certified minutes.
            </p>
          )}
        </div>
      )}

      {/* Pre-anchor chooser: pick what to audit (local / random / custom). */}
      {!anchor && !pickedUrl && (
        <GovAuditChooser
          viewerCity={viewerCity}
          viewerState={viewerState}
          initialUrl={targetUrlHint || pickLocalSite(viewerCity, viewerState).url}
          onPick={pickSiteToAudit}
        />
      )}

      {/* Audit panel — server-side snapshot + open in new tab + lock-as-anchor. */}
      {(anchor || pickedUrl) && (
        <AuditPanel
          sessionId={sessionId}
          anchor={anchor}
          auditUrl={auditUrl}
          onAuditUrl={(u) => setAuditUrl(u)}
          onTitle={(t) => setAuditTitle(t)}
          onLock={lockAnchor}
          locking={locking}
          lockError={lockError}
        />
      )}

      {/* Site-level rubric (once per session) */}
      {anchor && (
        <section className="rounded-lg border border-line bg-white p-4">
          <h2 className="text-base font-semibold text-ink">About the site (answer once)</h2>
          <div className="mt-3 space-y-4">
            <BoolRow
              label="Is it an official government domain (.gov / .mil / .us)?"
              value={draft.site?.official_domain}
              onChange={(v) => patchSite({ official_domain: v ? "1" : "0" })}
            />
            <BoolRow
              label="Does the site load over a secure (https) connection?"
              value={draft.site?.https}
              onChange={(v) => patchSite({ https: v ? "1" : "0" })}
            />
            <PpfRow
              label="Does it work on a phone-sized screen (responsive)?"
              value={draft.site?.mobile_responsive}
              onChange={(v) => patchSite({ mobile_responsive: v })}
            />
            <BoolRow
              label="Is there a translate / multilingual option?"
              value={draft.site?.language_access}
              onChange={(v) => patchSite({ language_access: v ? "1" : "0" })}
            />
            <PpfRow
              label="Does site search exist and return relevant results?"
              value={draft.site?.site_search}
              onChange={(v) => patchSite({ site_search: v })}
            />
          </div>
        </section>
      )}

      {/* Page-level rubric */}
      {anchor && (
        <section className="rounded-lg border border-line bg-white p-4">
          <h2 className="text-base font-semibold text-ink">Audit this page</h2>

          <h3 className="mt-4 text-sm font-semibold text-ink">Accessibility &amp; quality checks</h3>
          <div className="mt-2 space-y-4">
            {OBSERVABLE_ITEMS.map((item) => (
              <ObservableRow
                key={item.id}
                label={item.label}
                help={item.help}
                value={anchor[item.id] as Observable | undefined}
                onChange={(v) => patchAnchor({ [item.id]: v } as Partial<AnchorDraft>)}
              />
            ))}
            <ObservableRow
              label="Overall accessibility of this page"
              help="Your overall read, weighing the four checks above."
              value={anchor.accessibility}
              onChange={(v) => patchAnchor({ accessibility: v })}
            />
          </div>

          <h3 className="mt-6 text-sm font-semibold text-ink">Your ratings (1–5)</h3>
          <div className="mt-2 space-y-4">
            {LIKERT_ITEMS.map((item) => (
              <LikertRow
                key={item.id}
                label={item.prompt}
                low={item.low}
                high={item.high}
                value={anchor[item.id] as number | undefined}
                onChange={(v) => patchAnchor({ [item.id]: v } as Partial<AnchorDraft>)}
              />
            ))}
          </div>

          <h3 className="mt-6 text-sm font-semibold text-ink">
            In your words <span className="text-xs font-normal text-meta">(optional)</span>
          </h3>
          <p className="mt-1 text-xs text-body">
            Skip these if you&apos;d rather just submit your ratings — they don&apos;t affect whether you get credit.
          </p>
          <div className="mt-2 space-y-4">
            {FREE_TEXT_ITEMS.map((item) => (
              <div key={item.id}>
                <label className="text-sm text-ink">
                  {item.prompt} <span className="text-xs text-meta">(optional)</span>
                </label>
                <Textarea
                  defaultValue={(anchor[item.id] as string | undefined) ?? ""}
                  onBlur={(e) => patchAnchor({ [item.id]: e.target.value } as Partial<AnchorDraft>)}
                  rows={2}
                  className="mt-1"
                />
              </div>
            ))}
            <p className="text-xs text-body">
              If you do leave a comment, it&apos;s reviewed before appearing in the public dataset. Don&apos;t include
              personal information.
            </p>
          </div>
        </section>
      )}

      {/* Submit */}
      {anchor && (
        <section className="space-y-3">
          {submitError && <p className="text-sm text-brick">{submitError}</p>}
          {!rubricComplete && (
            <p className="text-sm text-body">
              Answer every accessibility check and all four 1–5 ratings to submit.
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button type="button" onClick={submit} disabled={!rubricComplete || submitting}>
              {submitting ? <><Loader2 className="size-4 animate-spin" /> Submitting…</> : "Submit audit"}
            </Button>
            <form action={cancelGovAuditAction}>
              <input type="hidden" name="session_id" value={sessionId} />
              <Button type="submit" variant="destructive" size="sm">
                Cancel task
              </Button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}

// ---------- small presentational rows ----------

function ChoiceGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
            value === o.value
              ? "border-navy bg-navy text-white"
              : "border-line bg-white text-ink hover:bg-section"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ObservableRow({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help: string;
  value: Observable | undefined;
  onChange: (v: Observable) => void;
}) {
  return (
    <div className="rounded-md border border-line p-3">
      <p className="text-sm font-medium text-ink">{label}</p>
      <p className="mt-0.5 text-xs text-body">{help}</p>
      <div className="mt-2">
        <ChoiceGroup
          options={OBSERVABLE_VALUES.map((v) => ({ value: v, label: OBSERVABLE_LABELS[v] }))}
          value={value}
          onChange={(v) => onChange(v as Observable)}
        />
      </div>
    </div>
  );
}

function LikertRow({
  label,
  low,
  high,
  value,
  onChange,
}: {
  label: string;
  low: string;
  high: string;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-ink">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="w-24 shrink-0 text-right text-xs text-body">{low}</span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`h-9 w-9 rounded-md border text-sm transition-colors ${
                value === n ? "border-navy bg-navy text-white" : "border-line bg-white text-ink hover:bg-section"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="w-24 shrink-0 text-xs text-body">{high}</span>
      </div>
    </div>
  );
}

function PpfRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-ink">{label}</p>
      <div className="mt-2">
        <ChoiceGroup options={SITE_PPF.map((v) => ({ value: v, label: PPF_LABEL[v] }))} value={value} onChange={onChange} />
      </div>
    </div>
  );
}

function BoolRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (v: boolean) => void;
}) {
  const cur = value === undefined ? undefined : value ? "yes" : "no";
  return (
    <div>
      <p className="text-sm font-medium text-ink">{label}</p>
      <div className="mt-2">
        <ChoiceGroup
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={cur}
          onChange={(v) => onChange(v === "yes")}
        />
      </div>
    </div>
  );
}

function coerceSite(patch: Record<string, string>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (k === "official_domain" || k === "https" || k === "language_access" || k === "mobile_firsthand") {
      out[k] = v === "1" || v === "true";
    } else {
      out[k] = v;
    }
  }
  return out;
}

function stripForDisplay(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`.replace(/\/$/, "") || u.origin;
  } catch {
    return url.split(/[?#]/)[0];
  }
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
