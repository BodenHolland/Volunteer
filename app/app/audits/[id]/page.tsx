import { notFound, redirect } from "next/navigation";
import { getDb } from "@/lib/cf";
import { requireUser } from "@/lib/session";
import { getLocale } from "@/lib/i18n";
import {
  USDA_THRIFTY_6,
  STORE_TYPES,
  EBT_OBSERVATIONS,
  type AuditRow,
  type AuditItemCaptureRow,
  type Store,
} from "@/lib/food-audit";
import { AuditClient, type AuditCopy } from "./audit-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Food price audit — Tended" };

const COPY = {
  en: {
    overline: "Food access price audit",
    title: "USDA Thrifty 6-item basket",
    intro:
      "Visit any food retailer. For each of the 6 basket items, snap a photo of the item next to its shelf tag and enter the price.",
    client: {
      step1Title: "Confirm the store you're at",
      step2Title: "What kind of store is it?",
      step3Title: "Does the store accept EBT?",
      step4Title: "Capture the 6 basket items",
      capturedSummary: "{n} of {total} captured",
      searchLabel: "Search a store by name or address",
      searchPlaceholder: "e.g. Safeway 2020 Market",
      searching: "Searching…",
      cancel: "Cancel",
      addStore: "Store not listed — add it",
      storeName: "Store name",
      storeNamePlaceholder: "Mi Tierra Market",
      address: "Address",
      addressPlaceholder: "2840 J St, Sacramento, CA 95816",
      useLocation: "Use my current location",
      locationUnavailable: "Device location unavailable.",
      locationError: "Couldn't read location.",
      locationNote:
        "We use device location to validate the audit and prevent duplicate submissions.",
      addStoreBtn: "Add store",
      inStock: "In stock",
      outOfStock: "Out of stock",
      notSoldHere: "Not sold here",
      notSoldAtStore: "Not sold at this store",
      photoLabel: "Photo of the item + its shelf tag",
      shelfPrice: "Shelf price (USD)",
      size: "Size",
      unit: "Unit",
      pricedBy: "Priced by",
      perPound: "Per pound",
      perUnit: "Per unit",
      expected: "Expected:",
      markingOos: "Marking this item as “out of stock”. No photo needed.",
      markingNotSold: "Marking this item as “not sold here”. No photo needed.",
      couldntSave: "Couldn't save.",
      saving: "Saving…",
      save: "Save",
      submitTitle: "Submit audit",
      measuredEngagement: "{m}m {s}s of measured engagement so far.",
      submitting: "Submitting…",
      submitBtn: "Submit audit",
      finishSteps: "Finish all 4 steps above before submitting.",
    },
  },
  es: {
    overline: "Auditoría de precios de acceso a la comida",
    title: "Canasta USDA Thrifty de 6 productos",
    intro:
      "Visita cualquier tienda de comida. Para cada uno de los 6 productos de la canasta, toma una foto del producto junto a su etiqueta de precio en el estante e ingresa el precio.",
    client: {
      step1Title: "Confirma la tienda en la que estás",
      step2Title: "¿Qué tipo de tienda es?",
      step3Title: "¿La tienda acepta EBT?",
      step4Title: "Captura los 6 productos de la canasta",
      capturedSummary: "{n} de {total} capturados",
      searchLabel: "Busca una tienda por nombre o dirección",
      searchPlaceholder: "p. ej. Safeway 2020 Market",
      searching: "Buscando…",
      cancel: "Cancelar",
      addStore: "La tienda no aparece — agrégala",
      storeName: "Nombre de la tienda",
      storeNamePlaceholder: "Mi Tierra Market",
      address: "Dirección",
      addressPlaceholder: "2840 J St, Sacramento, CA 95816",
      useLocation: "Usar mi ubicación actual",
      locationUnavailable: "La ubicación del dispositivo no está disponible.",
      locationError: "No se pudo leer la ubicación.",
      locationNote:
        "Usamos la ubicación del dispositivo para validar la auditoría y evitar envíos duplicados.",
      addStoreBtn: "Agregar tienda",
      inStock: "En existencia",
      outOfStock: "Agotado",
      notSoldHere: "No se vende aquí",
      notSoldAtStore: "No se vende en esta tienda",
      photoLabel: "Foto del producto + su etiqueta de precio",
      shelfPrice: "Precio en el estante (USD)",
      size: "Tamaño",
      unit: "Unidad",
      pricedBy: "Precio por",
      perPound: "Por libra",
      perUnit: "Por unidad",
      expected: "Se espera:",
      markingOos: "Marcando este producto como “agotado”. No se necesita foto.",
      markingNotSold: "Marcando este producto como “no se vende aquí”. No se necesita foto.",
      couldntSave: "No se pudo guardar.",
      saving: "Guardando…",
      save: "Guardar",
      submitTitle: "Enviar auditoría",
      measuredEngagement: "{m}m {s}s de actividad medida hasta ahora.",
      submitting: "Enviando…",
      submitBtn: "Enviar auditoría",
      finishSteps: "Completa los 4 pasos de arriba antes de enviar.",
    },
  },
} as const;

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const locale = await getLocale();
  const c = COPY[locale];
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
        <p className="overline mb-2">{c.overline}</p>
        <h1 className="text-[28px] font-semibold text-ink">{c.title}</h1>
        <p className="mt-2 text-body">{c.intro}</p>
      </header>
      <AuditClient
        audit={audit}
        store={store}
        captures={captures}
        basketItems={USDA_THRIFTY_6.items}
        storeTypes={STORE_TYPES}
        ebtOptions={EBT_OBSERVATIONS}
        copy={c.client as AuditCopy}
      />
    </div>
  );
}
