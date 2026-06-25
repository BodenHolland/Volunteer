"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Camera, Keyboard, ZoomIn, Eye, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AnchorDraft } from "@/lib/gov-audit";
import { previewPageAction } from "./gov-audit-actions";

/**
 * Auditing surface, replaces the in-app browser with a clear new-tab workflow.
 *
 * Why no embed: the rubric's accessibility checks (Tab focus, 200% zoom,
 * contrast, alt-text inspection) genuinely require the volunteer's real
 * browser. A screenshot-and-forward embed can't do those well, and several
 * higher-profile gov sites (NYC.gov via Akamai, etc.) block headless traffic
 * outright. So we hand them the URL, open it in a new tab, and pull a
 * server-side snapshot as visual reference. They run the real audit in their
 * own browser.
 */
export function AuditPanel({
  sessionId,
  anchor,
  auditUrl,
  onAuditUrl,
  onTitle,
  onLock,
  locking,
  lockError,
}: {
  sessionId: string;
  anchor: AnchorDraft | null;
  auditUrl: string;
  onAuditUrl: (url: string) => void;
  onTitle: (title: string | null) => void;
  onLock: () => void;
  locking: boolean;
  lockError: string | null;
}) {
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<string | null>(null);
  const [http, setHttp] = useState<number | null>(null);
  const lastFetched = useRef<string | null>(null);

  async function loadSnapshot(url: string) {
    if (!url || !/^https?:\/\//.test(url)) {
      setError("Enter a full URL starting with https://");
      return;
    }
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.set("session_id", sessionId);
    fd.set("url", url);
    const res = await previewPageAction(fd);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSnapshot(res.screenshot_b64);
    setSnapshotUrl(res.resolved_url || url);
    setResolved(res.resolved_url || url);
    setHttp(res.http_status);
    onTitle(res.page_title);
    lastFetched.current = url;
  }

  // Auto-load a snapshot when the URL changes (debounced via "different from
  // what we last fetched"). Anchor-locked sessions don't auto-fetch since the
  // URL is fixed and we already have it.
  useEffect(() => {
    if (!auditUrl || !/^https?:\/\//.test(auditUrl)) return;
    if (lastFetched.current === auditUrl) return;
    void loadSnapshot(auditUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditUrl]);

  const displayUrl = resolved || snapshotUrl || auditUrl;

  return (
    <section className="rounded-lg border border-line bg-white p-4">
      <h2 className="text-base font-semibold text-ink">{anchor ? "Auditing this page" : "Pick the page to audit"}</h2>
      <p className="mt-1 text-sm text-body">
        {anchor
          ? "Open the page in your real browser to evaluate it (accessibility checks need your own keyboard, zoom, and screen reader). The snapshot below is just a visual reference."
          : "Enter or paste the URL of the page you want to audit. We'll load a snapshot below so you have a visual reference, and you'll open the live page in a new tab to evaluate it."}
      </p>

      {/* URL bar + open in new tab + lock */}
      <div className="mt-3 flex flex-wrap items-stretch gap-2">
        <Input
          value={auditUrl}
          onChange={(e) => onAuditUrl(e.target.value)}
          placeholder="https://www.example.gov/…"
          className="min-w-0 flex-1 basis-64"
          spellCheck={false}
          disabled={!!anchor}
        />
        <Button asChild type="button" variant="secondary">
          <a
            href={displayUrl || auditUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!auditUrl || undefined}
          >
            <ExternalLink className="size-4" /> Open in new tab
          </a>
        </Button>
        {!anchor && (
          <Button type="button" onClick={onLock} disabled={!auditUrl || locking}>
            {locking ? "Locking…" : "Lock as my anchor"}
          </Button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-brick">{error}</p>}
      {lockError && <p className="mt-2 text-sm text-brick">{lockError}</p>}

      {/* Snapshot */}
      <div className="mt-3 overflow-hidden rounded-md border border-line bg-section">
        {loading ? (
          <div className="flex h-64 items-center justify-center gap-2 text-sm text-body">
            <Loader2 className="size-4 animate-spin" /> Loading snapshot…
          </div>
        ) : snapshot ? (
          <div>
            <img
              src={`data:image/png;base64,${snapshot}`}
              alt={`Snapshot of ${displayUrl}`}
              className="block w-full"
            />
            <div className="flex items-center justify-between border-t border-line px-3 py-1.5 text-xs text-body">
              <span className="truncate">
                Snapshot of <span className="font-medium text-ink">{displayUrl}</span>
                {http != null && http >= 200 && http < 400 && <span className="ml-1">(HTTP {http})</span>}
              </span>
              {auditUrl && (
                <button
                  type="button"
                  onClick={() => loadSnapshot(auditUrl)}
                  className="ml-3 shrink-0 font-medium text-navy underline-offset-4 hover:underline"
                >
                  Refresh
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center px-6 text-center text-sm text-body">
            {auditUrl
              ? "Snapshot will appear here."
              : "Enter a URL above to load a snapshot."}
          </div>
        )}
      </div>

      {/* Tips: native gestures the volunteer needs to use in their real browser */}
      <details className="mt-3 rounded-md border border-line bg-section px-3 py-2 text-sm" open={!anchor}>
        <summary className="cursor-pointer font-medium text-ink">How to run each check in your browser</summary>
        <ul className="mt-2 space-y-2 text-body">
          <li className="flex gap-2">
            <Keyboard className="mt-0.5 size-4 shrink-0 text-navy" />
            <span>
              <strong className="text-ink">Keyboard nav:</strong> press <kbd className="rounded border border-line bg-white px-1.5 text-xs">Tab</kbd>{" "}
              repeatedly. Can you reach every link and button? Can you see where focus is?
            </span>
          </li>
          <li className="flex gap-2">
            <ZoomIn className="mt-0.5 size-4 shrink-0 text-navy" />
            <span>
              <strong className="text-ink">200% zoom:</strong>{" "}
              <kbd className="rounded border border-line bg-white px-1.5 text-xs">Ctrl/Cmd +</kbd> a few times. Does
              content reflow without overlap or cutoff?
            </span>
          </li>
          <li className="flex gap-2">
            <Eye className="mt-0.5 size-4 shrink-0 text-navy" />
            <span>
              <strong className="text-ink">Contrast:</strong> is body text easy to read against its background? Light
              grey on white, or text over a busy image, usually fails.
            </span>
          </li>
          <li className="flex gap-2">
            <Search className="mt-0.5 size-4 shrink-0 text-navy" />
            <span>
              <strong className="text-ink">Alt text:</strong> right-click an image →{" "}
              <em>Inspect</em>. Look for <code className="rounded bg-white px-1 text-xs">alt=&quot;…&quot;</code> that
              actually describes the image. Decorative images may have empty alt; meaningful ones should not.
            </span>
          </li>
          <li className="flex gap-2">
            <Camera className="mt-0.5 size-4 shrink-0 text-navy" />
            <span>
              <strong className="text-ink">Primary action:</strong> can you find the main thing a resident comes here to
              do (apply, look up, pay) quickly?
            </span>
          </li>
        </ul>
      </details>
    </section>
  );
}
