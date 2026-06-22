import Link from "next/link";
import { CheckCircle2, Info, Settings } from "lucide-react";
import { requireRecipient } from "@/lib/session";
import { decryptField } from "@/lib/crypto";
import { parseJson, type Address } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "./actions";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "SNAP profile — Tended" };

const COPY = {
  en: {
    overline: "Benefits details",
    heading: "SNAP profile",
    onlyNeeded: "Only needed for certifying hours",
    onlyNeededBody:
      "The SNAP profile holds the details that appear on your CF 888 form — it only applies to people certifying volunteer hours toward SNAP. You're set up to volunteer without certification, so there's nothing to fill in here.",
    switchIntentPre: "If that changes, you can switch your intent in ",
    switchIntentLink: "settings",
    goToSettings: "Go to settings",
    appearsExactly: "This appears on your CF 888 exactly as entered.",
    profileSaved: "Profile saved.",
    identity: "Identity",
    legalName: "Legal name",
    caseNumber: "SNAP case number",
    dob: "Date of birth",
    phone: "Phone",
    address: "Address",
    street: "Street address",
    line2: "Apartment, suite, etc. (optional)",
    city: "City",
    state: "State",
    zip: "ZIP",
    saveProfile: "Save profile",
  },
  es: {
    overline: "Detalles de beneficios",
    heading: "Perfil de SNAP",
    onlyNeeded: "Solo se necesita para certificar horas",
    onlyNeededBody:
      "El perfil de SNAP contiene los datos que aparecen en tu formulario CF 888 — solo aplica a las personas que certifican horas de voluntariado para SNAP. Tienes la configuración para hacer voluntariado sin certificación, así que no hay nada que llenar aquí.",
    switchIntentPre: "Si eso cambia, puedes cambiar tu propósito en ",
    switchIntentLink: "configuración",
    goToSettings: "Ir a configuración",
    appearsExactly: "Esto aparece en tu CF 888 exactamente como lo ingreses.",
    profileSaved: "Perfil guardado.",
    identity: "Identidad",
    legalName: "Nombre legal",
    caseNumber: "Número de caso de SNAP",
    dob: "Fecha de nacimiento",
    phone: "Teléfono",
    address: "Dirección",
    street: "Dirección postal",
    line2: "Apartamento, suite, etc. (opcional)",
    city: "Ciudad",
    state: "Estado",
    zip: "Código postal",
    saveProfile: "Guardar perfil",
  },
} as const;

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireRecipient();
  const { saved } = await searchParams;
  const locale = await getLocale();
  const c = COPY[locale];

  if (user.intent !== "snap_cert") {
    return (
      <div className="max-w-[900px] space-y-5">
        <div className="border-l-4 border-teal bg-white px-5 py-5 md:px-6">
          <h1 className="service-heading text-[28px]">{c.heading}</h1>
        </div>
        <div className="service-panel bg-section p-5">
          <p className="flex items-center gap-2 font-medium text-ink">
            <Info className="size-5 text-forest" /> {c.onlyNeeded}
          </p>
          <p className="mt-2 text-sm text-body">
            {c.onlyNeededBody}
          </p>
          <p className="mt-3 text-sm text-body">
            {c.switchIntentPre}
            <Link href="/app/settings" className="font-medium text-forest underline-offset-4 hover:underline">
              {c.switchIntentLink}
            </Link>
            .
          </p>
          <Button asChild variant="secondary" className="mt-4">
            <Link href="/app/settings"><Settings /> {c.goToSettings}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const [legalName, caseNumber, dob, phone, addressJson] = await Promise.all([
    decryptField(user.legal_name),
    decryptField(user.case_number),
    decryptField(user.dob),
    decryptField(user.phone),
    decryptField(user.address_json),
  ]);
  const addr = parseJson<Address>(addressJson, { line1: "", city: "", state: "", zip: "" });

  return (
    <div className="max-w-[900px] space-y-5">
      <div className="border-l-4 border-teal bg-white px-5 py-5 md:px-6">
        <h1 className="service-heading text-[28px]">{c.heading}</h1>
        <p className="mt-1 text-body">{c.appearsExactly}</p>
      </div>

      {saved === "1" && (
        <div className="flex items-center gap-2 rounded-lg border border-line bg-forest-subtle px-4 py-3 text-sm font-medium text-forest">
          <CheckCircle2 className="size-5" /> {c.profileSaved}
        </div>
      )}

      <form action={updateProfile} className="space-y-6">
        <section className="service-panel space-y-4 p-5 md:p-6">
          <h2 className="text-base font-semibold text-ink">{c.identity}</h2>
          <div className="space-y-1.5">
            <Label htmlFor="legal_name">{c.legalName}</Label>
            <Input id="legal_name" name="legal_name" defaultValue={legalName ?? ""} autoComplete="name" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="case_number">{c.caseNumber}</Label>
              <Input id="case_number" name="case_number" defaultValue={caseNumber ?? ""} inputMode="numeric" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dob">{c.dob}</Label>
              <Input id="dob" name="dob" type="date" defaultValue={dob ?? ""} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{c.phone}</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={phone ?? ""} autoComplete="tel" />
          </div>
        </section>

        <section className="service-panel space-y-4 p-5 md:p-6">
          <h2 className="text-base font-semibold text-ink">{c.address}</h2>
          <div className="space-y-1.5">
            <Label htmlFor="line1">{c.street}</Label>
            <Input id="line1" name="line1" defaultValue={addr.line1} autoComplete="address-line1" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="line2">{c.line2}</Label>
            <Input id="line2" name="line2" defaultValue={addr.line2 ?? ""} autoComplete="address-line2" />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_5rem_7rem]">
            <div className="space-y-1.5">
              <Label htmlFor="city">{c.city}</Label>
              <Input id="city" name="city" defaultValue={addr.city} autoComplete="address-level2" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">{c.state}</Label>
              <Input id="state" name="state" defaultValue={addr.state} maxLength={2} autoComplete="address-level1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zip">{c.zip}</Label>
              <Input id="zip" name="zip" defaultValue={addr.zip} inputMode="numeric" autoComplete="postal-code" />
            </div>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit">{c.saveProfile}</Button>
        </div>
      </form>
    </div>
  );
}
