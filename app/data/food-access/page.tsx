import { loadVerifiedAudits } from "@/lib/audit-aggregate";
import { USDA_THRIFTY_6, STORE_TYPES } from "@/lib/food-audit";
import { relativeTime } from "@/lib/time";
import { getDict } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { requireUser } from "@/lib/session";

// Reads from D1 (Cloudflare context) and the signed-in user session, both
// unavailable at prerender time.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Food access dashboard | colift",
  description:
    "Volunteer-collected shelf prices for 6 neighborhood staples. Free, public, updated continuously.",
};

function fmtUsd(n: number | null): string {
  if (n == null) return "";
  return `$${n.toFixed(2)}`;
}

function fmtPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export default async function FoodAccessDashboardPage() {
  await requireUser();
  const report = await loadVerifiedAudits();
  const { locale, t } = await getDict();

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">{t.foodAccess.title}</h1>
        <p className="text-body mt-2 max-w-2xl">
          {t.foodAccess.intro}
        </p>
        <p className="text-sm text-body mt-3">
          {t.foodAccess.lastUpdated} {relativeTime(report.generated_at)} ·{" "}
          <a
            className="text-forest underline-offset-2 hover:underline"
            href="/api/data/audits.csv"
          >
            {t.foodAccess.downloadCsv}
          </a>
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <Stat value={report.verified_audits.toString()} label={t.foodAccess.verifiedAudits} />
        <Stat value={report.unique_stores.toString()} label={t.foodAccess.uniqueStores} />
        <Stat value={report.zips.length.toString()} label={t.foodAccess.zipsCovered} />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">{t.foodAccess.basketByZip}</h2>
        {report.zips.length === 0 ? (
          <p className="text-body">
            {t.foodAccess.noAudits}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line bg-white">
            <table className="w-full text-sm">
              <thead className="bg-section text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">{t.foodAccess.zip}</th>
                  <th className="px-3 py-2 font-medium">{t.foodAccess.audits}</th>
                  <th className="px-3 py-2 font-medium">{t.foodAccess.basketCost}</th>
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
          <h2 className="text-xl font-semibold mb-3">{t.foodAccess.oosTitle}</h2>
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
          <h2 className="text-xl font-semibold mb-3">{t.foodAccess.storeMix}</h2>
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

      <footer className="text-xs text-body border-t border-line pt-4">
        {t.foodAccess.methodology}
      </footer>
    </main>
    <SiteFooter />
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <p className="text-[13px] text-body">{label}</p>
      <p className="text-3xl font-semibold mt-1">{value}</p>
    </div>
  );
}
