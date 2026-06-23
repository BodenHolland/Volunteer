import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { Button } from "@/components/ui/button";
import { adminApproveGovAuditAction } from "@/app/app/gov-audits/[id]/gov-audit-actions";
import {
  OBSERVABLE_ITEMS,
  LIKERT_ITEMS,
  type GovAuditSessionRow,
  type GovAuditSiteEvalRow,
  type GovAuditPageEvalRow,
  type GovAuditAutoCheckRow,
} from "@/lib/gov-audit";

export const dynamic = "force-dynamic";

export default async function AdminGovAuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = getDb();
  const session = await db
    .prepare("SELECT * FROM gov_audit_sessions WHERE id = ?")
    .bind(id)
    .first<GovAuditSessionRow>();
  if (!session) notFound();

  const volunteer = await db
    .prepare("SELECT full_name, email FROM users WHERE id = ?")
    .bind(session.user_id)
    .first<{ full_name: string | null; email: string }>();

  // Public-cluster rows for this session (joined by the opaque ref).
  const ref = session.public_session_ref;
  const site = await db
    .prepare("SELECT * FROM gov_audit_site_evaluations WHERE public_session_ref = ?")
    .bind(ref)
    .first<GovAuditSiteEvalRow>();
  const pages = (
    await db
      .prepare("SELECT * FROM gov_audit_page_evaluations WHERE public_session_ref = ?")
      .bind(ref)
      .all<GovAuditPageEvalRow>()
  ).results ?? [];
  const checks = (
    await db
      .prepare("SELECT * FROM gov_audit_auto_checks WHERE public_session_ref = ?")
      .bind(ref)
      .all<GovAuditAutoCheckRow>()
  ).results ?? [];
  const checkByUrl = new Map(checks.map((c) => [c.url, c]));

  const integrityPct = session.integrity_score != null ? Math.round(session.integrity_score * 100) : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/admin/gov-audits" className="text-sm text-navy underline underline-offset-4">
        ← Website audits
      </Link>
      <header className="mb-6 mt-3">
        <h1 className="text-2xl font-semibold">Review · {session.id.slice(0, 16)}…</h1>
        <p className="text-body mt-1">
          {volunteer?.full_name ?? "—"} ({volunteer?.email}) · {session.device} ·{" "}
          {session.certified_minutes ?? 0} min certified · integrity {integrityPct ?? "—"}%
        </p>
        <p className="mt-1 text-sm text-body">Target: {session.target_descriptor}</p>
      </header>

      {session.status === "flagged" && (
        <div className="mb-4 rounded-md border border-brick bg-brick-subtle px-4 py-3 text-sm text-brick">
          Flagged — non-desktop device or self-report contradicted by automated checks. Review before crediting.
        </div>
      )}

      {site && (
        <section className="mb-4 rounded-lg border border-line bg-white p-5">
          <h2 className="mb-2 font-semibold">Site · {site.site_domain}</h2>
          <ul className="grid grid-cols-2 gap-1 text-sm text-body">
            <li>Official domain: {fmtBool(site.official_domain)}</li>
            <li>HTTPS: {fmtBool(site.https)}</li>
            <li>Mobile responsive: {site.mobile_responsive ?? "—"}</li>
            <li>Language access: {fmtBool(site.language_access)}</li>
            <li>Site search: {site.site_search ?? "—"}</li>
          </ul>
        </section>
      )}

      {pages.map((p) => {
        const chk = checkByUrl.get(p.url);
        return (
          <section key={p.id} className="mb-4 rounded-lg border border-line bg-white p-5">
            <h2 className="font-semibold">{p.page_title || p.url}</h2>
            <p className="mb-3 text-xs text-body">{p.url}</p>

            <div className="mb-3 rounded-md bg-section px-3 py-2 text-sm">
              <span className="font-medium">Auto-check ({chk?.check_mode ?? "—"}):</span>{" "}
              HTTP {chk?.http_status ?? "—"} · axe violations{" "}
              <span className={chk && (chk.axe_violations ?? 0) > 0 ? "font-semibold text-brick" : ""}>
                {chk?.axe_violations ?? "n/a"}
              </span>
              {p.accessibility === "pass" && (chk?.axe_violations ?? 0) >= 3 && (
                <span className="text-brick"> · contradicts a “pass” self-report</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1 text-sm text-body">
              {OBSERVABLE_ITEMS.map((it) => (
                <div key={it.id}>
                  {it.label}: <span className="text-ink">{(p[it.id] as string | null) ?? "—"}</span>
                </div>
              ))}
              <div>
                Overall accessibility: <span className="text-ink">{p.accessibility ?? "—"}</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-sm text-body">
              {LIKERT_ITEMS.map((it) => (
                <span key={it.id}>
                  {it.prompt}: <span className="text-ink">{(p[it.id] as number | null) ?? "—"}/5</span>
                </span>
              ))}
            </div>

            <div className="mt-3 space-y-1 text-sm">
              <p>
                <span className="text-body">Intent:</span> {p.intent_text || <em className="text-body">—</em>}
              </p>
              <p>
                <span className="text-body">Blocker:</span> {p.blocker_text || <em className="text-body">—</em>}
              </p>
              <p>
                <span className="text-body">Fix:</span> {p.fix_text || <em className="text-body">—</em>}
              </p>
              <p className="text-xs text-body">Text moderation: {p.text_moderation_status}</p>
            </div>
          </section>
        );
      })}

      {(session.status === "submitted" || session.status === "flagged") && (
        <form action={adminApproveGovAuditAction} className="mt-6">
          <input type="hidden" name="session_id" value={session.id} />
          <Button type="submit">
            Approve &amp; credit {Math.round(((session.certified_minutes ?? 0) / 60) * 100) / 100} h
          </Button>
        </form>
      )}
    </main>
  );
}

function fmtBool(v: number | null): string {
  return v == null ? "—" : v ? "Yes" : "No";
}
