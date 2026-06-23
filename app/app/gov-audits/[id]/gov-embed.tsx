"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EmbedAction, EmbedFrame } from "@/lib/gov-audit-browser";
import { startEmbedAction, interactEmbedAction } from "./gov-audit-actions";

/**
 * Live, interactive remote-browser surface. Renders a screenshot of a real
 * Cloudflare Browser Rendering session and forwards the volunteer's clicks,
 * scrolls and keystrokes back to that same session, refreshing the frame each
 * time. It behaves like a lightweight remote desktop — real interaction with
 * the live page, with a small per-action round-trip.
 */
export function EmbedBrowser({
  sessionId,
  anchorId,
  initialUrl,
  navTo,
  onFrame,
}: {
  sessionId: string;
  anchorId: string | null;
  initialUrl: string;
  /** Bump `nonce` to drive the embed to `url` (e.g. "Return to anchor"). */
  navTo?: { url: string; nonce: number };
  /** Reports the current resolved URL + title up to the parent for anchor lock. */
  onFrame?: (info: { url: string; title: string | null }) => void;
}) {
  const [frame, setFrame] = useState<EmbedFrame | null>(null);
  const [busy, setBusy] = useState(false);
  const [urlBar, setUrlBar] = useState(initialUrl);
  const imgRef = useRef<HTMLImageElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const bsidRef = useRef<string | null>(null);
  const lastUrlRef = useRef<string>(initialUrl);
  const inFlight = useRef(false);
  const queued = useRef<EmbedAction | null>(null);
  const startedRef = useRef(false);

  const applyFrame = useCallback(
    (f: EmbedFrame) => {
      setFrame(f);
      if (f.session_id) bsidRef.current = f.session_id;
      if (f.resolved_url) {
        lastUrlRef.current = f.resolved_url;
        setUrlBar(f.resolved_url);
        onFrame?.({ url: f.resolved_url, title: f.page_title });
      }
    },
    [onFrame]
  );

  const doStart = useCallback(
    async (url: string): Promise<EmbedFrame> => {
      setBusy(true);
      const fd = new FormData();
      fd.set("session_id", sessionId);
      fd.set("url", url);
      if (anchorId) fd.set("anchor_id", anchorId);
      const f = await startEmbedAction(fd);
      applyFrame(f);
      setBusy(false);
      return f;
    },
    [sessionId, anchorId, applyFrame]
  );

  const run = useCallback(
    async (action: EmbedAction) => {
      if (!bsidRef.current) return; // not started yet
      if (inFlight.current) {
        // Coalesce: accumulate scroll, otherwise keep only the latest action.
        if (action.type === "scroll" && queued.current?.type === "scroll") {
          queued.current = { type: "scroll", dy: queued.current.dy + action.dy };
        } else {
          queued.current = action;
        }
        return;
      }
      inFlight.current = true;
      setBusy(true);
      const fd = new FormData();
      fd.set("session_id", sessionId);
      fd.set("browser_session_id", bsidRef.current ?? "");
      if (anchorId) fd.set("anchor_id", anchorId);
      fd.set("action", JSON.stringify(action));
      let f = await interactEmbedAction(fd);
      if (f.dead) {
        // Session reaped — relaunch at the last known URL and retry once.
        f = await doStart(lastUrlRef.current);
      } else {
        applyFrame(f);
      }
      inFlight.current = false;
      setBusy(false);
      const next = queued.current;
      queued.current = null;
      if (next) void run(next);
    },
    [sessionId, anchorId, applyFrame, doStart]
  );

  // Navigate within the SAME session when one is live (cheap), else launch a
  // fresh session. Keeping one session per audit avoids spinning up a new remote
  // browser on every address-bar nav and keeps the nav-trail continuous.
  const navigate = useCallback(
    (url: string) => {
      if (bsidRef.current) void run({ type: "goto", url });
      else void doStart(url);
    },
    [run, doStart]
  );

  // Auto-start once on mount.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void doStart(initialUrl);
  }, [doStart, initialUrl]);

  // Drive to a URL when the parent bumps navTo.nonce (Return to anchor / goto).
  const lastNonce = useRef<number>(navTo?.nonce ?? 0);
  useEffect(() => {
    if (!navTo) return;
    if (navTo.nonce === lastNonce.current) return;
    lastNonce.current = navTo.nonce;
    navigate(navTo.url);
  }, [navTo, navigate]);

  // Native wheel listener so we can preventDefault (React onWheel is passive).
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      void run({ type: "scroll", dy: Math.round(e.deltaY) });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [run]);

  function viewportCoords(e: React.MouseEvent) {
    const img = imgRef.current;
    const vp = frame?.viewport ?? { width: 1280, height: 800 };
    if (!img) return { x: 0, y: 0 };
    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * vp.width;
    const y = ((e.clientY - rect.top) / rect.height) * vp.height;
    return { x: Math.round(x), y: Math.round(y) };
  }

  function onClick(e: React.MouseEvent) {
    surfaceRef.current?.focus();
    const { x, y } = viewportCoords(e);
    void run({ type: "click", x, y });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const k = e.key;
    const nav = ["Enter", "Backspace", "Tab", "Delete", "Home", "End", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (nav.includes(k)) {
      e.preventDefault();
      void run({ type: "key", key: k });
    } else if (k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      void run({ type: "type", text: k });
    }
  }

  const unavailable = frame?.mode === "unavailable";

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-line bg-section px-2 py-2">
        <button
          type="button"
          aria-label="Back"
          onClick={() => run({ type: "back" })}
          className="rounded p-1.5 text-body hover:bg-white"
        >
          <ArrowLeft className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Reload"
          onClick={() => run({ type: "reload" })}
          className="rounded p-1.5 text-body hover:bg-white"
        >
          <RotateCw className="size-4" />
        </button>
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(urlBar);
          }}
        >
          <Input
            value={urlBar}
            onChange={(e) => setUrlBar(e.target.value)}
            placeholder="https://www.example.gov/…"
            className="h-8 flex-1 text-sm"
            spellCheck={false}
          />
          <Button type="submit" size="sm" variant="secondary">
            Go
          </Button>
        </form>
      </div>

      {/* Anti-bot block notice — some sites (NYC.gov via Akamai, etc.) detect
          and block headless browsers. Show a clear fallback so the volunteer
          can still complete the audit on the real site in a new tab. */}
      {frame?.blocked && frame.screenshot_b64 && (
        <div className="flex items-start gap-3 border-b border-line bg-amber/10 px-3 py-2.5 text-sm text-ink">
          <div className="flex-1">
            <p className="font-medium">This site blocks our in-app browser.</p>
            <p className="mt-0.5 text-xs text-body">
              Some government sites use anti-bot defenses (Akamai, Imperva, Cloudflare) that block automated browsers
              regardless of user. Open the page in a new tab to audit it directly — when you come back, you can lock
              the URL here as your anchor.
            </p>
          </div>
          <a
            href={frame.resolved_url || urlBar}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-md border border-navy bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-section"
          >
            Open in new tab ↗
          </a>
        </div>
      )}

      {/* Interactive surface */}
      <div
        ref={surfaceRef}
        tabIndex={0}
        role="application"
        aria-label="Interactive page preview — click, scroll and type to explore"
        onClick={onClick}
        onKeyDown={onKeyDown}
        className="relative max-h-[640px] cursor-pointer select-none overflow-hidden bg-section outline-none focus:ring-2 focus:ring-navy/40"
      >
        {frame?.screenshot_b64 ? (
          <img
            ref={imgRef}
            src={`data:image/jpeg;base64,${frame.screenshot_b64}`}
            alt={frame.page_title ?? "Page"}
            className="w-full"
            draggable={false}
          />
        ) : (
          <div className="flex h-80 items-center justify-center px-6 text-center text-sm text-body">
            {unavailable ? (
              <div className="space-y-2">
                <p>The interactive browser isn&apos;t available here.</p>
                {frame?.resolved_url && (
                  <a
                    href={frame.resolved_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-navy underline underline-offset-4"
                  >
                    Open the page in a new tab ↗
                  </a>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Launching browser…
              </span>
            )}
          </div>
        )}

        {busy && frame?.screenshot_b64 && (
          <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-ink/70 p-1.5">
            <Loader2 className="size-4 animate-spin text-white" />
          </div>
        )}
      </div>

      <p className="border-t border-line px-3 py-1.5 text-xs text-body">
        Click links and buttons, scroll, and type just like a normal browser. There&apos;s a brief pause after each
        action while the live page updates.
      </p>
    </div>
  );
}
