import { notFound, redirect } from "next/navigation";
import { getDb } from "@/lib/cf";
import { requireUser } from "@/lib/session";
import { getLocale } from "@/lib/i18n";
import {
  USDA_THRIFTY_6,
  STORE_TYPES,
  EBT_OBSERVATIONS,
  TRAVEL_MODES,
  type AuditRow,
  type AuditItemCaptureRow,
  type Store,
} from "@/lib/food-audit";
import { previewCreditForAudit } from "@/lib/audit-pipeline";
import { AuditClient, type AuditCopy } from "./audit-client";
import { AiPrivacyNotice } from "@/components/ai-privacy-notice";

export const dynamic = "force-dynamic";
export const metadata = { title: "Food price audit — Tended" };

const COPY = {
  en: {
    overline: "Neighborhood food price audit",
    title: "Neighborhood food price audit",
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
      useLocationCta: "Use my location to find stores nearby",
      locating: "Finding stores near you…",
      nearbyTitle: "Stores near you",
      nearbyNone: "No stores found nearby. Search by name or add your store below.",
      searchOr: "Or search by name or address",
      away: "away",
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
      takePhoto: "Take photo",
      retake: "Retake",
      photoHint: "Use your camera — photograph the item next to its shelf price tag.",
      photoReady: "Photo ready",
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
      measuredEngagement: "Estimated credit: {h} hours · {n} items × 5 min{commute}",
      commuteAppend: " + {m} min round-trip from your home",
      noCommute: "",
      submitting: "Submitting…",
      submitBtn: "Submit audit",
      finishSteps: "Finish all 4 steps above before submitting.",
      edit: "Edit",
      commuteTitle: "How did you get to the store?",
      commuteHint: "We estimate round-trip travel time from your home and add it to your credited hours.",
      commuteRoundTrip: "Estimated round trip: about {m} min.",
      commuteUnknown: "We can't estimate your commute yet. Make sure your home address is saved on your SNAP profile — if it's already there, re-saving it will refresh the location lookup.",
      commuteUnknownCta: "Open SNAP profile →",
      customCommuteTitle: "Use my actual travel time instead",
      customCommuteHint: "Round-trip minutes. Capped at {cap} min — the slower of the drive and transit estimates.",
      customCommuteClear: "Use the estimate",
      cancelTask: "Cancel task",
      cancelConfirm: "Remove this task from your work? Your progress on it will be deleted.",
      cancelYes: "Yes, cancel",
      cancelNo: "Keep it",
    },
  },
  es: {
    overline: "Auditoría de precios de comida del vecindario",
    title: "Auditoría de precios de comida del vecindario",
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
      useLocationCta: "Usar mi ubicación para encontrar tiendas cercanas",
      locating: "Buscando tiendas cerca de ti…",
      nearbyTitle: "Tiendas cerca de ti",
      nearbyNone: "No se encontraron tiendas cercanas. Busca por nombre o agrega tu tienda abajo.",
      searchOr: "O busca por nombre o dirección",
      away: "de distancia",
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
      takePhoto: "Tomar foto",
      retake: "Volver a tomar",
      photoHint: "Usa tu cámara — fotografía el producto junto a su etiqueta de precio.",
      photoReady: "Foto lista",
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
      measuredEngagement: "Crédito estimado: {h} horas · {n} artículos × 5 min{commute}",
      commuteAppend: " + {m} min ida y vuelta desde tu casa",
      noCommute: "",
      submitting: "Enviando…",
      submitBtn: "Enviar auditoría",
      finishSteps: "Completa los 4 pasos de arriba antes de enviar.",
      edit: "Editar",
      commuteTitle: "¿Cómo llegaste a la tienda?",
      commuteHint: "Estimamos el tiempo de ida y vuelta desde tu casa y lo sumamos a tus horas acreditadas.",
      commuteRoundTrip: "Ida y vuelta estimada: unos {m} min.",
      commuteUnknown: "Aún no podemos estimar tu trayecto. Asegúrate de que tu dirección esté guardada en tu perfil de SNAP — si ya está, vuelve a guardarla para refrescar la búsqueda de ubicación.",
      commuteUnknownCta: "Abrir perfil de SNAP →",
      customCommuteTitle: "Usar mi tiempo real de viaje",
      customCommuteHint: "Minutos ida y vuelta. Límite de {cap} min — la estimación más lenta entre coche y transporte público.",
      customCommuteClear: "Usar la estimación",
      cancelTask: "Cancelar tarea",
      cancelConfirm: "¿Quitar esta tarea de tu trabajo? Se borrará tu progreso en ella.",
      cancelYes: "Sí, cancelar",
      cancelNo: "Conservarla",
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
    .prepare("SELECT * FROM audit_item_captures WHERE public_session_ref = ?")
    .bind(audit.public_session_ref)
    .all<AuditItemCaptureRow>();
  const captures = capturesRes.results ?? [];

  // Compute the credit preview server-side so the submit step shows the
  // volunteer exactly what they're being credited and why. Safe even when the
  // audit is still incomplete — items count and commute reflect current state.
  const creditPreview = await previewCreditForAudit(audit.id);

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold text-ink">{c.title}</h1>
        <p className="mt-2 text-body">{c.intro}</p>
        <AiPrivacyNotice locale={locale} className="mt-4" />
      </header>
      <AuditClient
        audit={audit}
        store={store}
        captures={captures}
        basketItems={USDA_THRIFTY_6.items}
        storeTypes={STORE_TYPES}
        ebtOptions={EBT_OBSERVATIONS}
        travelModes={TRAVEL_MODES}
        copy={c.client as AuditCopy}
        creditPreview={creditPreview}
      />
    </div>
  );
}
