import { loadVerifiedAudits } from "@/lib/audit-aggregate";
import { USDA_THRIFTY_6, STORE_TYPES } from "@/lib/food-audit";
import { relativeTime } from "@/lib/time";
import { getLocale } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { requireUser } from "@/lib/session";

// Reads from D1 (Cloudflare context) and the signed-in user session, both
// unavailable at prerender time.
export const dynamic = "force-dynamic";

const COPY = {
  en: {
    publicDataset: "Public dataset",
    title: "Food access dashboard",
    intro:
      "Volunteer-collected shelf-tag prices for 6 neighborhood staples — milk, eggs, bread, rice, beans, and bananas — across food retailers nationwide. Free, public, CC0. Data refreshes every 5 minutes.",
    lastUpdated: "Last updated",
    downloadCsv: "Download CSV",
    verifiedAudits: "Verified audits",
    uniqueStores: "Unique stores",
    zipsCovered: "ZIP codes covered",
    basketByZip: "Basket cost by ZIP code",
    noAudits:
      "No verified audits yet. As volunteers complete audits, this table populates with median basket cost per ZIP.",
    zip: "ZIP",
    audits: "Audits",
    basketCost: "Basket cost (sum of medians)",
    oosTitle: "Out-of-stock rate by item",
    storeMix: "Store-type mix",
    methodology:
      "Methodology: each row is the volunteer-captured shelf price (not promo / sale) of the specified item at a food retailer. Prices and median basket costs are derived from audits that passed automated photo + OCR + plausibility checks. Dataset is CC0 — reuse freely.",
  },
  es: {
    publicDataset: "Conjunto de datos público",
    title: "Panel de acceso a alimentos",
    intro:
      "Precios de etiqueta de estante recopilados por voluntarios para 6 productos básicos del vecindario — leche, huevos, pan, arroz, frijoles y plátanos — en tiendas de alimentos de todo el país. Gratis, público, CC0. Los datos se actualizan cada 5 minutos.",
    lastUpdated: "Última actualización",
    downloadCsv: "Descargar CSV",
    verifiedAudits: "Auditorías verificadas",
    uniqueStores: "Tiendas únicas",
    zipsCovered: "Códigos postales cubiertos",
    basketByZip: "Costo de la canasta por código postal",
    noAudits:
      "Aún no hay auditorías verificadas. A medida que los voluntarios completen auditorías, esta tabla se llenará con el costo medio de la canasta por código postal.",
    zip: "Código postal",
    audits: "Auditorías",
    basketCost: "Costo de la canasta (suma de medianas)",
    oosTitle: "Tasa de falta de existencias por artículo",
    storeMix: "Mezcla por tipo de tienda",
    methodology:
      "Metodología: cada fila es el precio de estante capturado por un voluntario (no promoción / oferta) del artículo especificado en una tienda de alimentos. Los precios y los costos medios de la canasta se derivan de auditorías que pasaron verificaciones automáticas de foto + OCR + plausibilidad. El conjunto de datos es CC0 — reutilízalo libremente.",
  },
} as const;
export const metadata = {
  title: "Food access dashboard — Tended",
  description:
    "Volunteer-collected shelf prices for 6 neighborhood staples. Free, public, updated continuously.",
};

function fmtUsd(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toFixed(2)}`;
}

function fmtPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export default async function FoodAccessDashboardPage() {
  await requireUser();
  const report = await loadVerifiedAudits();
  const locale = await getLocale();
  const c = COPY[locale];

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wide text-body">{c.publicDataset}</p>
        <h1 className="text-3xl font-semibold mt-1">{c.title}</h1>
        <p className="text-body mt-2 max-w-2xl">
          {c.intro}
        </p>
        <p className="text-sm text-body mt-3">
          {c.lastUpdated} {relativeTime(report.generated_at)} ·{" "}
          <a
            className="text-forest underline-offset-2 hover:underline"
            href="/api/data/audits.csv"
          >
            {c.downloadCsv}
          </a>
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <Stat value={report.verified_audits.toString()} label={c.verifiedAudits} />
        <Stat value={report.unique_stores.toString()} label={c.uniqueStores} />
        <Stat value={report.zips.length.toString()} label={c.zipsCovered} />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">{c.basketByZip}</h2>
        {report.zips.length === 0 ? (
          <p className="text-body">
            {c.noAudits}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line bg-white">
            <table className="w-full text-sm">
              <thead className="bg-section text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">{c.zip}</th>
                  <th className="px-3 py-2 font-medium">{c.audits}</th>
                  <th className="px-3 py-2 font-medium">{c.basketCost}</th>
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
          <h2 className="text-xl font-semibold mb-3">{c.oosTitle}</h2>
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
          <h2 className="text-xl font-semibold mb-3">{c.storeMix}</h2>
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
        {c.methodology}
      </footer>
    </main>
    <SiteFooter />
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-body">{label}</p>
      <p className="text-3xl font-semibold mt-1">{value}</p>
    </div>
  );
}
