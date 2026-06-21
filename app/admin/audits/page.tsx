import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { EmptyState } from "@/components/empty-state";
import { relativeTime } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Food audits — Tended admin" };

interface Row {
  id: string;
  submitted_at: number;
  session_time_seconds: number;
  validation_flag_count: number;
  validation_status: string;
  full_name: string | null;
  store_name: string | null;
  store_address: string | null;
}

export default async function AdminAuditsPage() {
  await requireAdmin();
  const db = getDb();
  const rows = await db
    .prepare(
      `SELECT a.id, a.submitted_at, a.session_time_seconds, a.validation_flag_count, a.validation_status,
              u.full_name, s.name AS store_name, s.address AS store_address
       FROM audits a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN stores s ON s.id = a.store_id
       WHERE a.validation_status IN ('submitted','flagged','validating')
       ORDER BY a.submitted_at DESC
       LIMIT 100`
    )
    .all<Row>();
  const list = rows.results ?? [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Food audits — spot review</h1>
        <p className="text-muted mt-1">
          Audits awaiting verification or human review. Approving credits the volunteer&apos;s measured
          time as hours.
        </p>
      </header>

      {list.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          title="Nothing in the queue"
          body="Submitted food audits will appear here when they need a human look."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/audits/${r.id}`}
                className="block rounded-lg border border-line bg-white px-4 py-3 hover:bg-section"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-medium text-ink">
                      {r.store_name ?? "Unknown store"}
                      {r.validation_flag_count > 0 ? (
                        <span className="ml-2 inline-block rounded-full bg-terracotta/20 text-terracotta text-xs px-2 py-0.5">
                          {r.validation_flag_count} flag{r.validation_flag_count > 1 ? "s" : ""}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-sm text-muted">
                      {r.full_name ?? "—"} · {r.store_address ?? "—"}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted">
                    <div>{relativeTime(r.submitted_at)}</div>
                    <div>
                      {Math.floor(r.session_time_seconds / 60)}m {r.session_time_seconds % 60}s
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
