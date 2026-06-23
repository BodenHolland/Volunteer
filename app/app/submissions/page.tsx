import { redirect } from "next/navigation";

// Submission history is now folded into the unified "My work" surface so the
// recipient app has a single place for everything they've committed to. The
// per-submission detail view at /app/submissions/[id] is still used.
//
// Marked dynamic so Next 15 doesn't try to statically pre-render a route whose
// only job is a server-side redirect — that fails the build's export step.
export const dynamic = "force-dynamic";

export default function SubmissionHistoryRedirect() {
  redirect("/app/projects");
}
