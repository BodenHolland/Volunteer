import { loadVerifiedAudits } from "@/lib/audit-aggregate";
import { USDA_THRIFTY_6, STORE_TYPES } from "@/lib/food-audit";
import { relativeTime } from "@/lib/time";

// Reads from D1 (Cloudflare context) which isn't available at prerender time.
// We rely on Cloudflare's edge cache (Cache-Control headers from /api/data/audits.csv)
// for performance rather than ISR.
export const dynamic = "force-dynamic";
export const metadata = {
  title: "California food access dashboard — Tended",
  description:
    "Volunteer-collected shelf prices for a 6-item USDA basket across California. Free, public, updated continuously.",
};

function fmtUsd(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toFixed(2)}`;
}

function fmtPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export default async function FoodAccessDashboardPage() {
  const report = await loadVerifiedAudits();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wide text-muted">Public dataset</p>
        <h1 className="text-3xl font-semibold mt-1">California food access dashboard</h1>
        <p className="text-muted mt-2 max-w-2xl">
          Volunteer-collected shelf-tag prices for a standard 6-item USDA basket — milk, eggs, bread,
          rice, beans, and fresh produce — across California food retailers. Free, public, CC0.
          Data refreshes every 5 minutes.
        </p>
        <p className="text-sm text-muted mt-3">
          Last updated {relativeTime(report.generated_at)} ·{" "}
          <a
            className="text-forest underline-offset-2 hover:underline"
            href="/api/data/audits.csv"
          >
            Download CSV
          </a>
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <Stat value={report.verified_audits.toString()} label="Verified audits" />
        <Stat value={report.unique_stores.toString()} label="Unique stores" />
        <Stat value={report.zips.length.toString()} label="ZIP codes covered" />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Basket cost by ZIP code</h2>
        {report.zips.length === 0 ? (
          <p className="text-muted">
            No verified audits yet. As volunteers complete audits, this table populates with median
            basket cost per ZIP.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line bg-white">
            <table className="w-full text-sm">
              <thead className="bg-section text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">ZIP</th>
                  <th className="px-3 py-2 font-medium">Audits</th>
                  <th className="px-3 py-2 font-medium">Basket cost (sum of medians)</th>
                  {USDA_THRIFTY_6.items.map((i) => (
                    <th key={i.id} className="px-3 py-2 font-medium">
                      {i.display_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.zips.map((z) => (
                  <tr key={z.zip} className="border-t border-line">
                    <td className="px-3 py-2 font-medium">{z.zip}</td>
                    <td className="px-3 py-2">{z.audit_count}</td>
                    <td className="px-3 py-2 font-semibold">{fmtUsd(z.basket_cost_usd)}</td>
                    {USDA_THRIFTY_6.items.map((i) => (
                      <td key={i.id} className="px-3 py-2">
                        {fmtUsd(z.median_prices[i.id])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-6 mb-10">
        <div>
          <h2 className="text-xl font-semibold mb-3">Out-of-stock rate by item</h2>
          <ul className="rounded-lg border border-line bg-white divide-y divide-line">
            {USDA_THRIFTY_6.items.map((i) => (
              <li key={i.id} className="flex justify-between px-4 py-2 text-sm">
                <span>{i.display_name}</span>
                <span className="font-medium">{fmtPct(report.oos_rate_overall[i.id] ?? 0)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-3">Store-type mix</h2>
          <ul className="rounded-lg border border-line bg-white divide-y divide-line">
            {STORE_TYPES.map((t) => (
              <li key={t.value} className="flex justify-between px-4 py-2 text-sm">
                <span>{t.label}</span>
                <span className="font-medium">{report.store_type_mix[t.value] ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="text-xs text-muted border-t border-line pt-4">
        Methodology: each row is the volunteer-captured shelf price (not promo / sale) of the
        specified item at a California food retailer. Prices and median basket costs are derived from
        audits that passed automated photo + OCR + plausibility checks. Dataset is CC0 — reuse freely.
      </footer>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="text-3xl font-semibold mt-1">{value}</p>
    </div>
  );
}
