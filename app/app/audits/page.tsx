import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { relativeTime } from "@/lib/time";
import { OPEN_PRICES_PROJECT_TAG } from "@/lib/open-prices";

export const dynamic = "force-dynamic";
export const metadata = { title: "My food audits — Tended" };

interface AuditMineRow {
  id: string;
  validation_status: string;
  submitted_at: number | null;
  credited_hours: number | null;
  store_name: string | null;
  store_address: string | null;
  sent_contribs: number;
  total_contribs: number;
}

export default async function MyAuditsPage() {
  const user = await requireUser();
  const db = getDb();
  const rows =
    (
      await db
        .prepare(
          `SELECT a.id, a.validation_status, a.submitted_at, a.credited_hours,
                  s.name AS store_name, s.address AS store_address,
                  COALESCE(SUM(CASE WHEN c.status = 'sent' THEN 1 ELSE 0 END), 0) AS sent_contribs,
                  COUNT(c.id) AS total_contribs
           FROM audits a
           LEFT JOIN stores s ON s.id = a.store_id
           LEFT JOIN open_prices_contributions c ON c.audit_id = a.id
           WHERE a.user_id = ?
           GROUP BY a.id
           ORDER BY COALESCE(a.submitted_at, a.started_at) DESC
           LIMIT 100`
        )
        .bind(user.id)
        .all<AuditMineRow>()
    ).results ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">My food audits</h1>
        <p className="text-muted mt-1">
          Every verified audit also flows into{" "}
          <a
            href={`https://prices.openfoodfacts.org/?project=${OPEN_PRICES_PROJECT_TAG}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest underline-offset-2 hover:underline"
          >
            Open Prices
          </a>
          , the global open-data food-price dataset.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-muted">
          No audits yet.{" "}
          <Link href="/app/tasks" className="text-forest underline-offset-2 hover:underline">
            Find a food audit to do
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-line bg-white px-4 py-3 flex justify-between gap-3"
            >
              <div>
                <div className="font-medium text-ink">
                  {r.store_name ?? "Draft audit"}
                </div>
                <div className="text-sm text-muted">{r.store_address ?? "(in progress)"}</div>
                <div className="text-xs text-muted mt-1">
                  {r.validation_status}
                  {r.credited_hours != null
                    ? ` · ${(r.credited_hours * 60).toFixed(0)} min credited`
                    : ""}
                  {r.total_contribs > 0
                    ? ` · ${r.sent_contribs}/${r.total_contribs} contributed to Open Prices`
                    : ""}
                </div>
              </div>
              <div className="text-right text-sm text-muted shrink-0">
                {r.submitted_at ? relativeTime(r.submitted_at) : "—"}
                {r.validation_status === "draft" || r.validation_status === "submitted" ? (
                  <div>
                    <Link
                      href={`/app/audits/${r.id}`}
                      className="text-forest underline-offset-2 hover:underline"
                    >
                      Continue
                    </Link>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
