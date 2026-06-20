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
          <p className="overline mb-1.5">
            {task.category === "translation" ? "Translation" : task.category === "neighborhood-writing" ? "Write-up" : "Notes"}
          </p>
          <p className="whitespace-pre-wrap rounded-lg border border-line bg-white p-4 text-sm leading-relaxed text-ink">
            {submission.user_notes}
          </p>
        </div>
      )}

      {photos.length > 0 && (
        <div>
          <p className="overline mb-1.5 flex items-center gap-1.5">
            <FileText className="size-3.5" /> {photos.length} photo{photos.length === 1 ? "" : "s"}
          </p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photos.map((p) => (
              <li key={p.id} className="overflow-hidden rounded-md border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/files?key=${encodeURIComponent(p.r2_key)}`}
                  alt="Submission"
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
