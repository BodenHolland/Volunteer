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
  estHours,
  maxHours,
}: {
  submissionId: string;
  estHours: number;
  maxHours: number;
}) {
  const [panel, setPanel] = useState<"none" | "changes" | "reject">("none");

  return (
    <div className="space-y-4">
      {/* Approve */}
      <form action={approveSubmission} className="rounded-lg border border-line bg-white p-4">
        <input type="hidden" name="submission_id" value={submissionId} />
        <Label htmlFor="hours" className="mb-1.5">Hours to credit</Label>
        <div className="flex items-center gap-3">
          <Input id="hours" name="hours" type="number" step="0.5" min="0" max={maxHours} defaultValue={estHours} className="w-28" />
          <span className="text-sm text-meta">capped at {maxHours}h</span>
        </div>
        <Button type="submit" className="mt-3 w-full"><Check /> Approve and certify</Button>
      </form>

      {/* Secondary actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="secondary" onClick={() => setPanel(panel === "changes" ? "none" : "changes")}>
          <MessageSquareWarning /> Request changes
        </Button>
        <Button type="button" variant="secondary" onClick={() => setPanel(panel === "reject" ? "none" : "reject")} className="border-brick text-brick hover:bg-brick-subtle">
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
