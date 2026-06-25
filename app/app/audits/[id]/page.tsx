import { notFound, redirect } from "next/navigation";
import { getDb } from "@/lib/cf";
import { requireUser } from "@/lib/session";
import { getDict } from "@/lib/i18n";
import {
  USDA_THRIFTY_6,
  EXTENDED_BASKET_CATALOG,
  STORE_TYPES,
  EBT_OBSERVATIONS,
  TRAVEL_MODES,
  type AuditRow,
  type AuditItemCaptureRow,
  type Store,
} from "@/lib/food-audit";
import { previewCreditForAudit } from "@/lib/audit-pipeline";
import { AuditClient, type AuditCopy } from "./audit-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Food price audit | colift" };

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const { t } = await getDict();
  const c = t.auditDetail;
  const db = getDb();
  const audit = await db.prepare("SELECT * FROM audits WHERE id = ?").bind(id).first<AuditRow>();
  if (!audit) notFound();
  if (audit.user_id !== user.id) redirect("/unauthorized");

  if (audit.submitted_at) redirect(`/app/audits/${id}/done`);

  const store = audit.store_id
    ? await db.prepare("SELECT * FROM stores WHERE id = ?").bind(audit.store_id).first<Store>()
    : null;
  const capturesRes = await db
    .prepare("SELECT * FROM audit_item_captures WHERE public_session_ref = ?")
    .bind(audit.public_session_ref)
    .all<AuditItemCaptureRow>();
  const captures = capturesRes.results ?? [];

  // Compute the credit preview server-side so the submit step shows the
  // volunteer exactly what they're being credited and why. Safe even when the
  // audit is still incomplete, items count and commute reflect current state.
  const creditPreview = await previewCreditForAudit(audit.id);

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold text-ink">{c.title}</h1>
        <p className="mt-2 text-body">{c.intro}</p>
      </header>
      <AuditClient
        audit={audit}
        store={store}
        captures={captures}
        basketItems={USDA_THRIFTY_6.items}
        optionalCatalog={EXTENDED_BASKET_CATALOG}
        storeTypes={STORE_TYPES}
        ebtOptions={EBT_OBSERVATIONS}
        travelModes={TRAVEL_MODES}
        copy={c as unknown as AuditCopy}
        creditPreview={creditPreview}
      />
    </div>
  );
}
