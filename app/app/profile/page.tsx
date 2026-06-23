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
import { AddressFields, DobInput, NameFields, PhoneInput } from "@/app/start/pii-fields";

export const dynamic = "force-dynamic";
export const metadata = { title: "SNAP profile — Tended" };

const COPY = {
  en: {
    overline: "Benefits details",
    heading: "SNAP profile",
    onlyNeeded: "Only needed for certifying hours",
    onlyNeededBody:
      "The SNAP profile holds the details that appear on your work-hours certification — it only applies to people certifying volunteer hours toward SNAP. You're set up to volunteer without certification, so there's nothing to fill in here.",
    switchIntentPre: "If that changes, you can switch your intent in ",
    switchIntentLink: "settings",
    goToSettings: "Go to settings",
    appearsExactly: "This appears on your work-hours certification exactly as entered.",
    profileSaved: "Profile saved.",
    identity: "Identity",
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
      "El perfil de SNAP contiene los datos que aparecen en tu certificación de horas — solo aplica a las personas que certifican horas de voluntariado para SNAP. Tienes la configuración para hacer voluntariado sin certificación, así que no hay nada que llenar aquí.",
    switchIntentPre: "Si eso cambia, puedes cambiar tu propósito en ",
    switchIntentLink: "configuración",
    goToSettings: "Ir a configuración",
    appearsExactly: "Esto aparece en tu certificación de horas exactamente como lo ingreses.",
    profileSaved: "Perfil guardado.",
    identity: "Identidad",
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
  const firstSpace = (legalName ?? "").indexOf(" ");
  const firstName = firstSpace === -1 ? (legalName ?? "") : (legalName ?? "").slice(0, firstSpace);
  const lastName = firstSpace === -1 ? "" : (legalName ?? "").slice(firstSpace + 1);

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
          <NameFields defaultFirst={firstName} defaultLast={lastName} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="case_number">{c.caseNumber}</Label>
              <Input id="case_number" name="case_number" defaultValue={caseNumber ?? ""} inputMode="numeric" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dob">{c.dob}</Label>
              <DobInput defaultValue={dob ?? ""} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{c.phone}</Label>
            <PhoneInput defaultValue={phone ?? ""} />
          </div>
        </section>

        <section className="service-panel space-y-4 p-5 md:p-6">
          <h2 className="text-base font-semibold text-ink">{c.address}</h2>
          <AddressFields
            defaultLine1={addr.line1}
            defaultLine2={addr.line2 ?? ""}
            defaultCity={addr.city}
            defaultState={addr.state}
            defaultZip={addr.zip}
            showStateField
          />
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit">{c.saveProfile}</Button>
        </div>
      </form>
    </div>
  );
}
