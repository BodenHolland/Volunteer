"use client";

import { useState } from "react";
import { cancelWork } from "@/app/app/projects/cancel-actions";

/**
 * Two-step "Cancel task" control for an active (un-submitted) project task.
 * First click reveals a confirm prompt; confirming posts to `cancelWork`, which
 * deletes the submission and returns the recipient to their dashboard.
 */
export function CancelTaskButton({
  submissionId,
  labels,
}: {
  submissionId: string;
  labels: { cancel: string; confirm: string; yes: string; no: string };
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm font-medium text-brick hover:underline"
      >
        {labels.cancel}
      </button>
    );
  }

  return (
    <form
      action={cancelWork}
      className="flex flex-col items-center gap-2 rounded-md border border-brick/30 bg-brick-subtle p-4 text-center"
    >
      <input type="hidden" name="submission_id" value={submissionId} />
      <p className="text-sm text-body">{labels.confirm}</p>
      <div className="flex items-center gap-4">
        <button type="submit" className="text-sm font-semibold text-brick hover:underline">
          {labels.yes}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-sm font-medium text-body hover:underline"
        >
          {labels.no}
        </button>
      </div>
    </form>
  );
}
