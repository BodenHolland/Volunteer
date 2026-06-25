"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

/** Polls the status endpoint while the submission is under AI review. */
export function AiPoller({ submissionId, initialStatus }: { submissionId: string; initialStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (status !== "ai_reviewing" && status !== "submitted") return;
    let active = true;
    const tick = async () => {
      try {
        const res = await fetch(`/api/submissions/${submissionId}/status`, { cache: "no-store" });
        const data = (await res.json()) as { status: string };
        if (!active) return;
        if (data.status !== status) {
          setStatus(data.status);
          router.refresh();
        }
      } catch {
        /* retry */
      }
    };
    const iv = setInterval(tick, 2000);
    tick();
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, [status, submissionId, router]);

  if (status !== "ai_reviewing" && status !== "submitted") return null;

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
