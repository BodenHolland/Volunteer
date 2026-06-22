import { redirect } from "next/navigation";

// Submission history is now folded into the unified "My work" surface so the
// recipient app has a single place for everything they've committed to. The
// per-submission detail view at /app/submissions/[id] is still used.
export default function SubmissionHistoryRedirect() {
  redirect("/app/projects");
}
