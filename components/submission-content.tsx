import { FileText } from "lucide-react";
import type { SubmissionFile, Submission, TaskTemplate } from "@/lib/types";

export function SubmissionContent({
  submission,
  task,
  files,
}: {
  submission: Submission;
  task: TaskTemplate;
  files: SubmissionFile[];
}) {
  const photos = files.filter((f) => f.kind === "photo");
  return (
    <div className="space-y-5">
      {submission.user_notes && (
        <div>
          <p className="whitespace-pre-wrap rounded-lg border border-line bg-white p-4 text-sm leading-relaxed text-ink">
            {submission.user_notes}
          </p>
        </div>
      )}

      {photos.length > 0 && (
        <div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p, i) => (
              <li key={p.id} className="overflow-hidden rounded-lg border border-line bg-section p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/files?key=${encodeURIComponent(p.r2_key)}`}
                  alt={`Submitted photo ${i + 1} of ${photos.length}`}
                  className="aspect-square w-full object-cover"
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {!submission.user_notes && photos.length === 0 && (
        <p className="text-sm text-meta">No content attached.</p>
      )}
    </div>
  );
}
