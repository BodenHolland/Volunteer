"use client";

import { useState } from "react";
import { Check, MessageSquareWarning, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { approveSubmission, requestChanges, rejectSubmission } from "@/app/org/org-actions";

export function ReviewActions({
  submissionId,
  measuredHours,
  capHours,
  estHours,
}: {
  submissionId: string;
  measuredHours: number;
  capHours: number;
  estHours: number;
}) {
  const [panel, setPanel] = useState<"none" | "changes" | "reject">("none");
  // Credit defaults to measured engagement, capped. Reviewers may only reduce
  // for quality, never credit above the volunteer's actual measured time.
  const ceiling = Math.min(measuredHours, capHours);
  const round = (n: number) => Math.round(n * 10) / 10;

  return (
    <div className="service-panel space-y-4 p-5">
      <div>
        <p className="text-lg font-semibold text-ink">Review decision</p>
        <p className="mt-1 text-sm text-body">Choose an outcome, then record the measured hours to certify.</p>
      </div>
      {/* Approve */}
      <form action={approveSubmission} className="rounded-lg border-2 border-forest bg-teal-subtle p-4">
        <input type="hidden" name="submission_id" value={submissionId} />
        <Label htmlFor="hours" className="mb-1.5">Hours to credit</Label>
        <div className="flex items-center gap-3">
          <Input id="hours" name="hours" type="number" step="0.5" min="0" max={round(ceiling)} defaultValue={round(ceiling)} className="w-28" />
          <span className="text-sm text-meta">measured time · max {round(ceiling)}h</span>
        </div>
        <p className="mt-2 text-xs text-meta">
          Defaults to the volunteer&apos;s measured active time. You can reduce it for quality, but
          never credit above measured time. The {round(estHours)}h task estimate is a ceiling and
          flag only, it is not the credited number. Reject to credit zero.
        </p>
        <Button type="submit" className="mt-4 w-full"><Check /> Approve and certify</Button>
      </form>

      {/* Secondary actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="secondary" onClick={() => setPanel(panel === "changes" ? "none" : "changes")} className="h-auto min-h-14 justify-start border-amber/60 text-left text-amber hover:bg-amber-subtle">
          <MessageSquareWarning /> Request changes
        </Button>
        <Button type="button" variant="secondary" onClick={() => setPanel(panel === "reject" ? "none" : "reject")} className="h-auto min-h-14 justify-start border-brick text-left text-brick hover:bg-brick-subtle">
          <XCircle /> Reject
        </Button>
      </div>

      {panel === "changes" && (
        <form action={requestChanges} className="rounded-lg border border-amber/30 bg-amber-subtle p-4">
          <input type="hidden" name="submission_id" value={submissionId} />
          <Label htmlFor="reason-c" className="mb-1.5">What needs to change?</Label>
          <Textarea id="reason-c" name="reason" required placeholder="Tell the volunteer what to fix and resubmit." />
          <Button type="submit" variant="secondary" className="mt-3">Send back for changes</Button>
        </form>
      )}

      {panel === "reject" && (
        <form action={rejectSubmission} className="rounded-lg border border-brick/30 bg-brick-subtle p-4">
          <input type="hidden" name="submission_id" value={submissionId} />
          <Label htmlFor="reason-r" className="mb-1.5">Reason for rejection</Label>
          <Textarea id="reason-r" name="reason" required placeholder="Explain why this can't be credited." />
          <Button type="submit" className="mt-3 bg-brick hover:brightness-95">Reject submission</Button>
        </form>
      )}
    </div>
  );
}
