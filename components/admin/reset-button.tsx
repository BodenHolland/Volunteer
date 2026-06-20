"use client";

import { useState } from "react";
import Link from "next/link";
import { RotateCcw, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type State = "idle" | "working" | "done" | "error";

export function ResetButton() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    if (state === "working") return;
    const ok = window.confirm(
      "This wipes ALL data and reseeds the demo dataset. Any changes made during this session will be lost. Continue?"
    );
    if (!ok) return;
    setState("working");
    setError(null);
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? `Request failed (${res.status})`);
        setState("error");
        return;
      }
      setState("done");
    } catch (e) {
      setError(String(e));
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-lg border border-line bg-forest-subtle p-4">
        <p className="flex items-center gap-2 font-medium text-forest">
          <CheckCircle2 className="size-5" /> Demo data reset.
        </p>
        <p className="mt-1 text-sm text-body">The database has been wiped and reseeded.</p>
        <Button asChild variant="secondary" className="mt-3">
          <Link href="/admin">Back to overview</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button variant="destructive" onClick={handleReset} disabled={state === "working"}>
        {state === "working" ? <Loader2 className="animate-spin" /> : <RotateCcw />}
        {state === "working" ? "Resetting…" : "Wipe and reseed demo data"}
      </Button>
      {state === "error" && error && (
        <p className="text-sm text-brick">Could not reset: {error}</p>
      )}
    </div>
  );
}
