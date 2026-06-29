"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

/** States that mean AI review is still running; anything else is terminal. */
const PENDING_STATUSES = new Set(["ai_reviewing", "submitted"]);

/** Poll cadence: start fast, back off, and give up after a bounded window. */
const POLL_BASE_MS = 2_000;
const POLL_MAX_MS = 15_000;
const POLL_MAX_ATTEMPTS = 40;

/** Polls the status endpoint while the submission is under AI review. */
export function AiPoller({ submissionId, initialStatus }: { submissionId: string; initialStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!PENDING_STATUSES.has(status)) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      // Exponential backoff, capped — avoids hammering a slow/stuck worker.
      const delay = Math.min(POLL_BASE_MS * 2 ** Math.min(attemptsRef.current, 6), POLL_MAX_MS);
      timer = setTimeout(tick, delay);
    };

    const tick = async () => {
      if (!active) return;
      attemptsRef.current += 1;
      try {
        const res = await fetch(`/api/submissions/${submissionId}/status`, { cache: "no-store" });
        const data = (await res.json()) as { status: string };
        if (!active) return;
        if (data.status !== status) {
          setStatus(data.status);
          router.refresh();
          // Stop here if we reached a terminal state; effect re-runs and bails.
          if (!PENDING_STATUSES.has(data.status)) return;
        }
      } catch {
        /* network blip — keep polling within the attempt cap */
      }
      if (!active) return;
      // Cap total attempts so a wedged worker can't poll forever.
      if (attemptsRef.current >= POLL_MAX_ATTEMPTS) return;
      schedule();
    };

    schedule();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [status, submissionId, router]);

  if (!PENDING_STATUSES.has(status)) return null;

  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-amber/30 bg-amber-subtle p-4"
      role="status"
      aria-live="polite"
    >
      <Sparkles className="size-5 animate-colift-pulse text-amber" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-amber">Submission received. AI reviewing…</p>
        <p className="text-xs text-ink">This usually takes a few seconds. You can stay on this page.</p>
      </div>
    </div>
  );
}
