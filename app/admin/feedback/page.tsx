import { MessageSquare } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { EmptyState } from "@/components/empty-state";
import { relativeTime } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Feedback — colift admin" };

interface FeedbackRow {
  id: string;
  email: string | null;
  body: string;
  created_at: number;
}

export default async function AdminFeedbackPage() {
  await requireAdmin();
  const rows = (await getDb()
    .prepare("SELECT id, email, body, created_at FROM feedback ORDER BY created_at DESC")
    .all<FeedbackRow>()).results ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold text-ink">Feedback</h1>
        <p className="mt-1 text-body">Messages left through the contact form.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<MessageSquare />} title="No feedback yet." body="Messages from the contact form will appear here." />
      ) : (
        <ul className="space-y-3">
          {rows.map((f) => (
            <li key={f.id} className="rounded-lg border border-line bg-white p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-ink">{f.email ?? "Anonymous"}</span>
                <span className="text-xs text-meta">{relativeTime(f.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-body">{f.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
