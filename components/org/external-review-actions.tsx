"use client";

import { useState } from "react";
import { Check, MessageSquareWarning, XCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  approveExternalSubmission,
  requestExternalChanges,
  rejectExternalSubmission,
} from "@/app/org/external-actions";

const TRIPLE = ["yes", "no", "unclear"] as const;

function TripleField({ name, label }: { name: string; label: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-ink">{label}</p>
      <div className="flex gap-2">
        {TRIPLE.map((v) => (
          <label key={v} className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-line bg-white text-xs font-medium capitalize text-ink has-[:checked]:border-forest has-[:checked]:bg-teal-subtle has-[:checked]:text-forest">
            <input type="radio" name={name} value={v} required className="sr-only" defaultChecked={v === "yes"} />
            {v}
          </label>
        ))}
      </div>
    </div>
  );
}

export function ExternalReviewActions({
  submissionId,
  monthlyCapMinutes,
  remainingCapMinutes,
  defaultProjectName,
  defaultProjectSlug,
}: {
  submissionId: string;
  monthlyCapMinutes: number;
  remainingCapMinutes: number;
  defaultProjectName: string;
  defaultProjectSlug: string;
}) {
  const [panel, setPanel] = useState<"none" | "changes" | "reject">("none");
  const remainingHours = Math.round((remainingCapMinutes / 60) * 10) / 10;

  return (
    <div className="service-panel space-y-4 p-5">
      <div>
        <p className="text-lg font-semibold text-ink">Certificate review</p>
        <p className="mt-1 text-xs text-body">
          <ShieldCheck className="mr-1 inline size-3.5 align-text-bottom text-forest" />
          Confirm the certificate is legible, in scope, and matches the volunteer. Credit the minutes Zooniverse recorded.
        </p>
      </div>

      <form action={approveExternalSubmission} className="space-y-4 rounded-lg border-2 border-forest bg-teal-subtle p-4">
        <input type="hidden" name="submission_id" value={submissionId} />

        <TripleField name="cert_name_matches_user" label="Name on certificate matches volunteer" />
        <TripleField name="date_range_present" label="Date range is present" />
        <TripleField name="hours_present" label="Total hours are present" />
        <TripleField name="project_scope_match" label="Project matches what volunteer described" />
        <TripleField name="signature_present" label="Zooniverse identity / signature present" />
        <TripleField name="profile_url_matches" label="Profile URL opens an account that matches the certificate name" />
        <TripleField name="screenshot_supports_certificate" label="Dashboard screenshot is consistent with the certificate" />

        <div>
          <Label htmlFor="project_name" className="mb-1.5">Project (confirm or correct)</Label>
          <Input
            id="project_name"
            name="project_name"
            defaultValue={defaultProjectName}
            required
            maxLength={120}
          />
        </div>
        <div>
          <Label htmlFor="project_slug" className="mb-1.5">Project slug (optional)</Label>
          <Input
            id="project_slug"
            name="project_slug"
            defaultValue={defaultProjectSlug}
            maxLength={200}
            placeholder="zooniverse/snapshot-serengeti"
          />
        </div>

        <div>
          <Label htmlFor="credited_minutes" className="mb-1.5">Credited minutes (from certificate)</Label>
          <Input
            id="credited_minutes"
            name="credited_minutes"
            type="number"
            min="0"
            max={remainingCapMinutes}
            step="1"
            required
            placeholder="e.g. 180"
            className="w-32"
          />
          <p className="mt-1 text-xs text-meta">
            Remaining this month: {remainingHours}h ({remainingCapMinutes} min) · monthly cap {Math.round(monthlyCapMinutes / 60)}h
          </p>
        </div>

        <div>
          <Label htmlFor="reviewer_note" className="mb-1.5">Reviewer note (optional)</Label>
          <Textarea id="reviewer_note" name="reviewer_note" rows={2} placeholder="Anything to remember about this submission" />
        </div>

        <Button type="submit" className="w-full"><Check /> Approve and certify</Button>
      </form>

      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="secondary" onClick={() => setPanel(panel === "changes" ? "none" : "changes")} className="h-auto min-h-14 justify-start border-amber/60 text-left text-amber hover:bg-amber-subtle">
          <MessageSquareWarning /> Request changes
        </Button>
        <Button type="button" variant="secondary" onClick={() => setPanel(panel === "reject" ? "none" : "reject")} className="h-auto min-h-14 justify-start border-brick text-left text-brick hover:bg-brick-subtle">
          <XCircle /> Reject
        </Button>
      </div>

      {panel === "changes" && (
        <form action={requestExternalChanges} className="rounded-lg border border-amber/30 bg-amber-subtle p-4">
          <input type="hidden" name="submission_id" value={submissionId} />
          <Label htmlFor="reason-c" className="mb-1.5">What needs to change?</Label>
          <Textarea id="reason-c" name="reason" required placeholder="Tell the volunteer what to fix and resubmit." />
          <Button type="submit" variant="secondary" className="mt-3">Send back for changes</Button>
        </form>
      )}

      {panel === "reject" && (
        <form action={rejectExternalSubmission} className="rounded-lg border border-brick/30 bg-brick-subtle p-4">
          <input type="hidden" name="submission_id" value={submissionId} />
          <Label htmlFor="reason-r" className="mb-1.5">Reason for rejection</Label>
          <Textarea id="reason-r" name="reason" required placeholder="Explain why this can't be credited." />
          <Button type="submit" className="mt-3 bg-brick hover:brightness-95">Reject submission</Button>
        </form>
      )}
    </div>
  );
}
