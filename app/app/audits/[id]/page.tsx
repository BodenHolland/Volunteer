import { notFound, redirect } from "next/navigation";
import { getDb } from "@/lib/cf";
import { requireUser } from "@/lib/session";
import {
  USDA_THRIFTY_6,
  STORE_TYPES,
  EBT_OBSERVATIONS,
  type AuditRow,
  type AuditItemCaptureRow,
  type Store,
} from "@/lib/food-audit";
import { AuditClient } from "./audit-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Food price audit — Tended" };

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const db = getDb();
  const audit = await db.prepare("SELECT * FROM audits WHERE id = ?").bind(id).first<AuditRow>();
  if (!audit) notFound();
  if (audit.user_id !== user.id) redirect("/unauthorized");

  if (audit.submitted_at) redirect(`/app/audits/${id}/done`);

  const store = audit.store_id
    ? await db.prepare("SELECT * FROM stores WHERE id = ?").bind(audit.store_id).first<Store>()
    : null;
  const capturesRes = await db
    .prepare("SELECT * FROM audit_item_captures WHERE audit_id = ?")
    .bind(id)
    .all<AuditItemCaptureRow>();
  const captures = capturesRes.results ?? [];

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <header className="mb-6">
        <p className="overline mb-2">Food access price audit</p>
        <h1 className="text-[28px] font-semibold text-ink">USDA Thrifty 6-item basket</h1>
        <p className="mt-2 text-body">
          Visit any food retailer. For each of the 6 basket items, snap a photo of the item next to
          its shelf tag and enter the price.
        </p>
      </header>
      <AuditClient
        audit={audit}
        store={store}
        captures={captures}
        basketItems={USDA_THRIFTY_6.items}
        storeTypes={STORE_TYPES}
        ebtOptions={EBT_OBSERVATIONS}
      />
    </div>
  );
}
