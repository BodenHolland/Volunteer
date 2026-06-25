import Link from "next/link";
import { CheckCircle2, Info, Settings } from "lucide-react";
import { requireRecipient } from "@/lib/session";
import { decryptField } from "@/lib/crypto";
import { parseJson, type Address } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "./actions";
import { getDict } from "@/lib/i18n";
import { AddressFields, DobInput, NameFields } from "@/app/start/pii-fields";

export const dynamic = "force-dynamic";
export const metadata = { title: "SNAP profile — colift" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireRecipient();
  const { saved } = await searchParams;
  const { locale, t } = await getDict();

  if (user.intent !== "snap_cert") {
    return (
      <div className="max-w-[900px] space-y-5">
        <div className="rounded-md border border-line bg-white px-5 py-5 md:px-6">
          <h1 className="service-heading text-[28px]">{t.appProfile.heading}</h1>
        </div>
        <div className="service-panel bg-section p-5">
          <p className="flex items-center gap-2 font-medium text-ink">
            <Info className="size-5 text-forest" /> {t.appProfile.onlyNeeded}
          </p>
          <p className="mt-2 text-sm text-body">
            {t.appProfile.onlyNeededBody}
          </p>
          <p className="mt-3 text-sm text-body">
            {t.appProfile.switchIntentPre}
            <Link href="/app/settings" className="font-medium text-forest underline-offset-4 hover:underline">
              {t.appProfile.switchIntentLink}
            </Link>
            .
          </p>
          <Button asChild variant="secondary" className="mt-4">
            <Link href="/app/settings"><Settings /> {t.appProfile.goToSettings}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const [legalName, caseNumber, dob, addressJson] = await Promise.all([
    decryptField(user.legal_name),
    decryptField(user.case_number),
    decryptField(user.dob),
    decryptField(user.address_json),
  ]);
  const addr = parseJson<Address>(addressJson, { line1: "", city: "", state: "", zip: "" });
  const firstSpace = (legalName ?? "").indexOf(" ");
  const firstName = firstSpace === -1 ? (legalName ?? "") : (legalName ?? "").slice(0, firstSpace);
  const lastName = firstSpace === -1 ? "" : (legalName ?? "").slice(firstSpace + 1);

  return (
    <div className="max-w-[900px] space-y-5">
      <div className="rounded-md border border-line bg-white px-5 py-5 md:px-6">
        <h1 className="service-heading text-[28px]">{t.appProfile.heading}</h1>
        <p className="mt-1 text-body">{t.appProfile.appearsExactly}</p>
      </div>

      {saved === "1" && (
        <div className="flex items-center gap-2 rounded-lg border border-line bg-forest-subtle px-4 py-3 text-sm font-medium text-forest">
          <CheckCircle2 className="size-5" /> {t.appProfile.profileSaved}
        </div>
      )}

      <form action={updateProfile} className="space-y-6">
        <section className="service-panel space-y-4 p-5 md:p-6">
          <h2 className="text-base font-semibold text-ink">{t.appProfile.identity}</h2>
          <NameFields defaultFirst={firstName} defaultLast={lastName} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="case_number">{t.appProfile.caseNumber}</Label>
              <Input id="case_number" name="case_number" defaultValue={caseNumber ?? ""} inputMode="numeric" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dob">{t.appProfile.dob}</Label>
              <DobInput defaultValue={dob ?? ""} />
            </div>
          </div>
        </section>

        <section className="service-panel space-y-4 p-5 md:p-6">
          <h2 className="text-base font-semibold text-ink">{t.appProfile.address}</h2>
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
          <Button type="submit">{t.appProfile.saveProfile}</Button>
        </div>
      </form>
    </div>
  );
}
