"use client";

import { useEffect, useState } from "react";

interface Status {
  validation_status: string;
  credited_hours: number | null;
}

export interface DoneCopy {
  verified: string;
  minutesCredited: string;
  hoursCredited: string;
  pricesFlowingLead: string;
  pricesFlowingTail: string;
  rejected: string;
  rejectedBody: string;
  flagged: string;
  verifying: string;
}

export function DonePolling({
  auditId,
  initialStatus,
  creditedHours,
  copy,
}: {
  auditId: string;
  initialStatus: string;
  creditedHours: number | null;
  copy: DoneCopy;
}) {
  const [status, setStatus] = useState<Status>({ validation_status: initialStatus, credited_hours: creditedHours });

  useEffect(() => {
    if (status.validation_status === "verified" || status.validation_status === "rejected") return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/audits/${auditId}/status`, { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as Status;
        setStatus(data);
        if (data.validation_status === "verified" || data.validation_status === "rejected") {
          clearInterval(t);
        }
      } catch {
        // network blip; keep polling
      }
    }, 4000);
    return () => clearInterval(t);
  }, [auditId, status.validation_status]);

  if (status.validation_status === "verified") {
    return (
      <div className="mt-6 rounded-lg border border-forest bg-forest-subtle px-5 py-4 inline-block">
        <p className="font-semibold text-forest">{copy.verified}</p>
        <p className="text-sm text-ink mt-1">
          {status.credited_hours != null
            ? copy.minutesCredited.replace("{mins}", (status.credited_hours * 60).toFixed(0))
            : copy.hoursCredited}
        </p>
        <p className="text-xs text-body mt-3">
          {copy.pricesFlowingLead}{" "}
          <a
            href="https://prices.openfoodfacts.org/?project=tended-ca-food-access"
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest underline-offset-2 hover:underline"
          >
            Open Prices
          </a>
          {copy.pricesFlowingTail}
        </p>
      </div>
    );
  }
  if (status.validation_status === "rejected") {
    return (
      <div className="mt-6 rounded-lg border border-brick bg-brick-subtle px-5 py-4 inline-block">
        <p className="font-semibold text-brick">{copy.rejected}</p>
        <p className="text-sm text-ink mt-1">{copy.rejectedBody}</p>
      </div>
    );
  }
  return (
    <div className="mt-6 rounded-lg border border-line bg-section px-5 py-4 inline-flex items-center gap-2">
      <span className="inline-block h-2 w-2 rounded-full bg-forest animate-pulse" />
      <p className="text-sm text-ink">
        {status.validation_status === "flagged" ? copy.flagged : copy.verifying}
      </p>
    </div>
  );
}
