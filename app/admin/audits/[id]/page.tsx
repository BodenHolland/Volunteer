import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { Button } from "@/components/ui/button";
import { adminApproveAuditAction, adminRejectAuditAction } from "@/app/app/audits/[id]/audit-actions";
import {
  USDA_THRIFTY_6,
  STORE_TYPES,
  EBT_OBSERVATIONS,
  type AuditRow,
  type AuditItemCaptureRow,
  type AuditPhotoRow,
  type Store,
  type ValidationFlagRow,
  creditedHoursFromSeconds,
} from "@/lib/food-audit";

export const dynamic = "force-dynamic";

export default async function AdminAuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = getDb();
  const audit = await db.prepare("SELECT * FROM audits WHERE id = ?").bind(id).first<AuditRow>();
  if (!audit) notFound();
  const store = audit.store_id
    ? await db.prepare("SELECT * FROM stores WHERE id = ?").bind(audit.store_id).first<Store>()
    : null;
  const volunteer = await db
    .prepare("SELECT full_name, email FROM users WHERE id = ?")
    .bind(audit.user_id)
    .first<{ full_name: string | null; email: string }>();
  const capturesRes = await db
    .prepare("SELECT * FROM audit_item_captures WHERE audit_id = ?")
    .bind(id)
    .all<AuditItemCaptureRow>();
  const captures = capturesRes.results ?? [];
  const photoRes = await db
    .prepare("SELECT * FROM audit_photos WHERE audit_id = ?")
    .bind(id)
    .all<AuditPhotoRow>();
  const photos = new Map((photoRes.results ?? []).map((p) => [p.id, p]));
  const flagRes = await db
    .prepare("SELECT * FROM audit_validation_flags WHERE audit_id = ?")
    .bind(id)
    .all<ValidationFlagRow>();
  const flags = flagRes.results ?? [];

  const contribRes = await db
    .prepare(
      `SELECT basket_item_id, status, attempt_count, open_prices_id, last_error
       FROM open_prices_contributions WHERE audit_id = ?`
    )
    .bind(id)
    .all<{
      basket_item_id: string;
      status: string;
      attempt_count: number;
      open_prices_id: string | null;
      last_error: string | null;
    }>();
  const contribs = contribRes.results ?? [];

  const credited = creditedHoursFromSeconds(audit.session_time_seconds);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Spot review · audit {audit.id.slice(0, 12)}…</h1>
        <p className="text-body mt-1">
          {volunteer?.full_name ?? "—"} ({volunteer?.email}) ·{" "}
          {Math.floor(audit.session_time_seconds / 60)}m {audit.session_time_seconds % 60}s measured
        </p>
      </header>

      <section className="rounded-lg border border-line bg-white p-5 mb-4">
        <h2 className="font-semibold mb-2">Store</h2>
        <p>
          {store?.name ?? "—"} · {store?.address ?? "—"}
        </p>
        <p className="text-sm text-body mt-1">
          GPS: {store?.geocode_lat?.toFixed(4) ?? "—"}, {store?.geocode_lng?.toFixed(4) ?? "—"}
        </p>
        <p className="text-sm text-body mt-1">
          Type: {STORE_TYPES.find((t) => t.value === audit.store_type_observed)?.label ?? "—"} · EBT:{" "}
          {EBT_OBSERVATIONS.find((e) => e.value === audit.ebt_observation)?.label ?? "—"}
        </p>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 mb-4">
        <h2 className="font-semibold mb-3">Basket captures</h2>
        <ul className="flex flex-col gap-3">
          {USDA_THRIFTY_6.items.map((item) => {
            const cap = captures.find((c) => c.basket_item_id === item.id);
            const photo = cap?.photo_id ? photos.get(cap.photo_id) : null;
            return (
              <li key={item.id} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="font-medium">{item.display_name}</div>
                    <div className="text-sm text-body">{item.spec}</div>
                    {cap ? (
                      cap.stock_status === "in-stock" ? (
                        <div className="mt-1 text-sm">
                          <strong>${cap.price_usd?.toFixed(2)}</strong> / {cap.size_value} {cap.size_unit}
                          {cap.produce_pricing_mode ? ` · ${cap.produce_pricing_mode}` : ""}
                        </div>
                      ) : (
                        <div className="mt-1 text-sm text-body">
                          {cap.stock_status === "out-of-stock" ? "Out of stock" : "Not sold here"}
                        </div>
                      )
                    ) : (
                      <div className="mt-1 text-sm text-brick">Not captured</div>
                    )}
                  </div>
                  {photo ? (
                    <a
                      href={`/api/files?key=${encodeURIComponent(photo.r2_key)}`}
                      target="_blank"
                      rel="noopener"
                      className="text-sm text-forest underline-offset-2 hover:underline shrink-0"
                    >
                      View photo
                    </a>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {contribs.length > 0 ? (
        <section className="rounded-lg border border-line bg-white p-5 mb-4">
          <h2 className="font-semibold mb-2">Open Prices contributions</h2>
          <ul className="text-sm flex flex-col gap-1">
            {contribs.map((c) => (
              <li key={c.basket_item_id} className="flex justify-between">
                <span>
                  <strong>{c.basket_item_id}</strong> — {c.status}
                  {c.attempt_count ? ` (${c.attempt_count} attempt${c.attempt_count > 1 ? "s" : ""})` : ""}
                  {c.last_error ? <span className="text-brick"> — {c.last_error}</span> : null}
                </span>
                {c.open_prices_id ? (
                  <a
                    href={`https://prices.openfoodfacts.org/prices/${c.open_prices_id}`}
                    target="_blank"
                    rel="noopener"
                    className="text-forest underline-offset-2 hover:underline"
                  >
                    open-prices/{c.open_prices_id}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {flags.length > 0 ? (
        <section className="rounded-lg border border-terracotta bg-terracotta/10 p-5 mb-4">
          <h2 className="font-semibold mb-2">Flags ({flags.length})</h2>
          <ul className="text-sm flex flex-col gap-2">
            {flags.map((f) => (
              <li key={f.id}>
                <strong>{f.flag_type}</strong> ({f.flag_severity}): {f.flag_reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-lg border border-line bg-white p-5 flex flex-col gap-3">
        <h2 className="font-semibold">Resolve</h2>
        <p className="text-sm text-body">
          Approving credits <strong>{(credited * 60).toFixed(0)} minutes</strong> ({credited} hours) to
          this volunteer for the current month, certified by Tended Food Access.
        </p>
        <div className="flex gap-3">
          <form action={adminApproveAuditAction}>
            <input type="hidden" name="audit_id" value={audit.id} />
            <Button type="submit">Approve · credit {credited}h</Button>
          </form>
          <form action={adminRejectAuditAction} className="flex gap-2 flex-1">
            <input type="hidden" name="audit_id" value={audit.id} />
            <input
              name="reason"
              placeholder="Reason for rejection"
              className="flex-1 rounded-md border border-line px-3 py-2 text-sm"
            />
            <Button type="submit" variant="destructive">
              Reject
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
