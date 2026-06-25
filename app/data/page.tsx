import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getDb } from "@/lib/cf";
import { loadVerifiedAudits } from "@/lib/audit-aggregate";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

// Reads from D1 (Cloudflare context) and the signed-in user session, both
// unavailable at prerender.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Datasets — colift",
  description:
    "Datasets produced by colift volunteers, available to signed-in users as CSV and JSON downloads.",
};

export default async function DataIndexPage() {
  await requireUser();
  const { locale, t } = await getDict();

  const report = await loadVerifiedAudits();
  const foodRows = report.verified_audits;

  const db = getDb();
  const govCountRow = await db
    .prepare(`SELECT COUNT(*) AS n FROM gov_audit_page_evaluations`)
    .first<{ n: number }>();
  const govRows = govCountRow?.n ?? 0;
  const emsCountRow = await db
    .prepare(`SELECT COUNT(*) AS n FROM ems_rate_reports WHERE published_at IS NOT NULL`)
    .first<{ n: number }>();
  const emsRows = emsCountRow?.n ?? 0;
  const zoonCountRow = await db
    .prepare(`SELECT COUNT(*) AS n FROM zooniverse_public_activity`)
    .first<{ n: number }>();
  const zoonRows = zoonCountRow?.n ?? 0;

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold">{t.dataIndex.title}</h1>
          <p className="text-body mt-2 max-w-2xl">{t.dataIndex.intro}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-forest">
            <LockKeyhole className="size-4" /> {t.dataIndex.accessNote}
          </p>
        </header>

        <ul className="grid gap-5 md:grid-cols-2">
          <li>
            <DatasetCard
              title={t.dataIndex.foodTitle}
              body={t.dataIndex.foodBody}
              count={`${foodRows.toLocaleString()} ${t.dataIndex.rows}`}
              dashboardHref="/data/food-access"
              dashboardLabel={t.dataIndex.viewDashboard}
              csvHref="/api/data/audits.csv"
              jsonHref={null}
              csvLabel={t.dataIndex.downloadCsv}
              jsonLabel={t.dataIndex.downloadJson}
            />
          </li>
          <li>
            <DatasetCard
              title={t.dataIndex.emsTitle}
              body={t.dataIndex.emsBody}
              count={`${emsRows.toLocaleString()} ${t.dataIndex.rows}`}
              dashboardHref={null}
              dashboardLabel={t.dataIndex.viewDashboard}
              csvHref="/api/data/ems-rates.csv"
              jsonHref="/api/data/ems-rates.json"
              csvLabel={t.dataIndex.downloadCsv}
              jsonLabel={t.dataIndex.downloadJson}
            />
          </li>
          <li>
            <DatasetCard
              title={t.dataIndex.govTitle}
              body={t.dataIndex.govBody}
              count={`${govRows.toLocaleString()} ${t.dataIndex.rows}`}
              dashboardHref={null}
              dashboardLabel={t.dataIndex.viewDashboard}
              csvHref="/api/data/gov-audits.csv"
              jsonHref="/api/data/gov-audits.json"
              csvLabel={t.dataIndex.downloadCsv}
              jsonLabel={t.dataIndex.downloadJson}
            />
          </li>
          <li>
            <DatasetCard
              title="Citizen-science classifications (Zooniverse)"
              body="Verified hours volunteers contributed to public-interest research projects on Zooniverse, aggregated by project and reporting month. No PII — keyed only by an opaque per-submission reference."
              count={`${zoonRows.toLocaleString()} ${t.dataIndex.rows}`}
              dashboardHref={null}
              dashboardLabel={t.dataIndex.viewDashboard}
              csvHref="/api/data/zooniverse-activity.csv"
              jsonHref="/api/data/zooniverse-activity.json"
              csvLabel={t.dataIndex.downloadCsv}
              jsonLabel={t.dataIndex.downloadJson}
            />
          </li>
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}

function DatasetCard({
  title,
  body,
  count,
  dashboardHref,
  dashboardLabel,
  csvHref,
  jsonHref,
  csvLabel,
  jsonLabel,
}: {
  title: string;
  body: string;
  count: string;
  dashboardHref: string | null;
  dashboardLabel: string;
  csvHref: string;
  jsonHref: string | null;
  csvLabel: string;
  jsonLabel: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-line bg-white p-5">
      <p className="text-[13px] text-body">{count}</p>
      <h2 className="mt-1 text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-body">{body}</p>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 text-sm">
        {dashboardHref && (
          <Link
            href={dashboardHref}
            className="inline-flex items-center gap-1 font-medium text-forest hover:underline"
          >
            {dashboardLabel}
            <ArrowRight className="size-4" />
          </Link>
        )}
        <a className="text-forest underline-offset-2 hover:underline" href={csvHref}>
          {csvLabel}
        </a>
        {jsonHref && (
          <a className="text-forest underline-offset-2 hover:underline" href={jsonHref}>
            {jsonLabel}
          </a>
        )}
      </div>
    </div>
  );
}
