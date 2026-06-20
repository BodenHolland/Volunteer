"use client";

import { useEffect, useState, useTransition } from "react";
import { Play, Square, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startSession, stopSession } from "@/app/app/project-actions";
import type { TimeLogSession } from "@/lib/types";

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function TimeLog({ submissionId, sessions, locked }: { submissionId: string; sessions: TimeLogSession[]; locked?: boolean }) {
  const open = sessions.find((s) => s.end === null);
  const completedMs = sessions.reduce((a, s) => a + (s.end ? s.end - s.start : 0), 0);
  const [now, setNow] = useState(() => Date.now());
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [open]);

  const liveMs = completedMs + (open ? now - open.start : 0);

  return (
    <div>
      <div className="flex items-center justify-between rounded-lg border border-line bg-section p-4">
        <div className="flex items-center gap-3">
          <Clock className="size-5 text-meta" />
          <div>
            <p className="text-2xl font-semibold tabular-nums text-ink">{fmt(liveMs)}</p>
            <p className="text-xs text-meta">{sessions.length} session{sessions.length === 1 ? "" : "s"} logged</p>
          </div>
        </div>
        {!locked &&
          (open ? (
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => {
                const fd = new FormData();
                fd.set("submission_id", submissionId);
                start(() => stopSession(fd));
              }}
            >
              <Square className="fill-current" /> Stop session
            </Button>
          ) : (
            <Button
              disabled={pending}
              onClick={() => {
                const fd = new FormData();
                fd.set("submission_id", submissionId);
                start(() => startSession(fd));
              }}
            >
              <Play className="fill-current" /> Start session
            </Button>
          ))}
      </div>
      {open && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-amber" aria-live="polite">
          <span className="inline-block size-2 animate-tended-pulse rounded-full bg-amber" /> Session running
        </p>
      )}
    </div>
  );
}
