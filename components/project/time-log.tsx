"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Play, Square, Clock, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startSession, stopSession } from "@/app/app/project-actions";
import { ACTIVITY_IDLE_THRESHOLD_MS } from "@/lib/engagement";
import type { TimeLogSession } from "@/lib/types";

function fmt(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function TimeLog({
  submissionId,
  sessions,
  measuredActiveSeconds,
  locked,
  copy,
}: {
  submissionId: string;
  sessions: TimeLogSession[];
  measuredActiveSeconds: number;
  locked?: boolean;
  copy?: {
    activeTime: string;
    session: string;
    sessions: string;
    stop: string;
    start: string;
    measuring: string;
    onlyActive: string;
  };
}) {
  const c = copy ?? {
    activeTime: "active time",
    session: "session",
    sessions: "sessions",
    stop: "Stop session",
    start: "Start session",
    measuring: "Measuring active time — only counts while this tab is open and you're working.",
    onlyActive: "Only active time is credited — never idle time or estimates.",
  };
  const open = sessions.find((s) => s.end === null);
  const [pending, start] = useTransition();

  // Active/idle measurement for the current running session.
  const activeRef = useRef(0);
  const idleRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const [activeNow, setActiveNow] = useState(0);

  useEffect(() => {
    if (!open || locked) return;
    activeRef.current = 0;
    idleRef.current = 0;
    lastActivityRef.current = Date.now();
    setActiveNow(0);

    const mark = () => (lastActivityRef.current = Date.now());
    const events = ["mousemove", "keydown", "pointerdown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }));

    const iv = setInterval(() => {
      const visible = document.visibilityState === "visible";
      const interacted = Date.now() - lastActivityRef.current < ACTIVITY_IDLE_THRESHOLD_MS;
      if (visible && interacted) {
        activeRef.current += 1;
        setActiveNow(activeRef.current);
      } else {
        idleRef.current += 1;
      }
    }, 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, mark));
      clearInterval(iv);
    };
  }, [open, locked]);

  const totalActive = measuredActiveSeconds + (open ? activeNow : 0);

  const doStart = () => {
    const fd = new FormData();
    fd.set("submission_id", submissionId);
    start(() => startSession(fd));
  };
  const doStop = () => {
    const fd = new FormData();
    fd.set("submission_id", submissionId);
    fd.set("active_seconds", String(activeRef.current));
    fd.set("idle_seconds", String(idleRef.current));
    start(() => stopSession(fd));
  };

  return (
    <div>
      <div className="flex items-center justify-between rounded-lg border border-line bg-section p-4">
        <div className="flex items-center gap-3">
          <Activity className="size-5 text-meta" />
          <div>
            <p className="text-2xl font-semibold tabular-nums text-ink">{fmt(totalActive)}</p>
            <p className="text-xs text-meta">{c.activeTime} · {sessions.length} {sessions.length === 1 ? c.session : c.sessions}</p>
          </div>
        </div>
        {!locked &&
          (open ? (
            <Button variant="secondary" disabled={pending} onClick={doStop}>
              <Square className="fill-current" /> {c.stop}
            </Button>
          ) : (
            <Button disabled={pending} onClick={doStart}>
              <Play className="fill-current" /> {c.start}
            </Button>
          ))}
      </div>
      {open && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-amber" aria-live="polite">
          <span className="inline-block size-2 animate-tended-pulse rounded-full bg-amber" />
          {c.measuring}
        </p>
      )}
      <p className="mt-1 flex items-center gap-1 text-xs text-meta">
        <Clock className="size-3" /> {c.onlyActive}
      </p>
    </div>
  );
}
