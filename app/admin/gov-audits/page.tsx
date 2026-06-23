import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { EmptyState } from "@/components/empty-state";
import { relativeTime } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Website audits — Tended admin" };

interface Row {
  id: string;
  submitted_at: number | null;
  status: string;
  certified_minutes: number | null;
  integrity_score: number | null;
  full_name: string | null;
  target_descriptor: string;
}

export default async function AdminGovAuditsPage() {
  await requireAdmin();
  const db = getDb();
  const rows = await db
    .prepare(
      `SELECT g.id, g.submitted_at, g.status, g.certified_minutes, g.integrity_score,
              g.target_descriptor, u.full_name
       FROM gov_audit_sessions g
       JOIN users u ON u.id = g.user_id
       WHERE g.status IN ('submitted','flagged')
       ORDER BY g.submitted_at DESC
       LIMIT 100`
    )
    .all<Row>();
  const list = rows.results ?? [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Website audits — review</h1>
        <p className="text-body mt-1">
          Submitted government-website audits awaiting review. Approving credits the volunteer&apos;s
          certified time (capped, auto-corroborated) as hours.
        </p>
      </header>

      {list.length === 0 ? (
        <EmptyState icon={<Inbox />} title="Nothing to review" body="Submitted website audits will appear here." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="bg-section text-left text-xs uppercase tracking-wide text-body">
              <tr>
                <th className="px-4 py-2">Volunteer</th>
                <th className="px-4 py-2">Target</th>
                <th className="px-4 py-2">Submitted</th>
                <th className="px-4 py-2">Certified</th>
                <th className="px-4 py-2">Integrity</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-t border-line hover:bg-section">
                  <td className="px-4 py-2">
                    <Link href={`/admin/gov-audits/${r.id}`} className="font-medium text-navy underline underline-offset-4">
                      {r.full_name ?? "—"}
                    </Link>
                  </td>
                  <td className="max-w-[20rem] truncate px-4 py-2 text-body">{r.target_descriptor}</td>
                  <td className="px-4 py-2 text-body">{r.submitted_at ? relativeTime(r.submitted_at) : "—"}</td>
                  <td className="px-4 py-2 tabular-nums">{r.certified_minutes ?? 0} min</td>
                  <td className="px-4 py-2 tabular-nums">
                    {r.integrity_score != null ? `${Math.round(r.integrity_score * 100)}%` : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span className={r.status === "flagged" ? "text-brick" : "text-body"}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
