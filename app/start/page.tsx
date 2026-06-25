import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDb } from "@/lib/cf";
import { homeForUser, requireUser } from "@/lib/session";
import { decryptField } from "@/lib/crypto";
import { parseJson, type Address, type Org } from "@/lib/types";
import { getDict } from "@/lib/i18n";
import { submitLocation, submitPii, submitOrgPick } from "./actions";
import { AddressFields, DobInput, NameFields, PhoneInput } from "./pii-fields";

export const metadata = { title: "Finish setting up | colift" };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-section px-4 py-10">
      <Link href="/" className="mb-8">
        <Logo size={24} className="text-xl" />
      </Link>
      <div className="w-full max-w-[560px] rounded-lg border border-line bg-white p-8 shadow-sm">
        {children}
      </div>
    </main>
  );
}

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const db = getDb();
  const user = await requireUser();
  const { t } = await getDict();
  const s = t.start;

  const ROLE_STEPS = [s.stepLocation, s.stepDetails, s.stepDone];

  // Skip onboarding entirely if the user has already finished it.
  const isOnboarded =
    user.role === "org_member"
      ? !!user.org_id
      : !!user.city && !!user.state && user.intent !== "n/a";
  if (!sp.step && isOnboarded) {
    redirect(homeForUser(user));
  }

  const step = sp.step ?? (user.role === "org_member" ? "orgpick" : "location");

  // PII is stored encrypted at rest. Decrypt before rendering so the form
  // shows the actual values back to the signed-in owner.
  const [legalName, caseNumber, dob, phone, addressJsonPlain] = await Promise.all([
    decryptField(user.legal_name),
    decryptField(user.case_number),
    decryptField(user.dob),
    decryptField(user.phone),
    decryptField(user.address_json),
  ]);
  const addr = parseJson<Address>(addressJsonPlain, {
    line1: "",
    city: "",
    state: "",
    zip: "",
  });

  const firstSpace = (legalName ?? "").indexOf(" ");
  const firstName = firstSpace === -1 ? (legalName ?? "") : (legalName ?? "").slice(0, firstSpace);
  const lastName = firstSpace === -1 ? "" : (legalName ?? "").slice(firstSpace + 1);

  function StepHint({ index }: { index: number }) {
    return (
      <p className="mb-2 text-sm text-body">
        {s.stepHintPrefix} {index + 1} {s.stepHintOf} {ROLE_STEPS.length} · {ROLE_STEPS[index]}
      </p>
    );
  }

  // ---- LOCATION + INTENT ----
  if (step === "location") {
    return (
      <Shell>
        <StepHint index={0} />
        <h1 className="text-[28px] font-semibold leading-tight text-ink">{s.locationTitle}</h1>
        <form action={submitLocation} className="mt-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="city">{s.city}</Label>
              <Input id="city" name="city" required defaultValue={addr.city} placeholder={s.cityPlaceholder} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">{s.state}</Label>
              <Input
                id="state"
                name="state"
                required
                defaultValue={addr.state}
                maxLength={2}
                placeholder="CA"
              />
            </div>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-ink">{s.intentLegend}</legend>
            {[
              { v: "casual_volunteer", t: s.intentVolunteer, hint: "" },
              {
                v: "snap_cert",
                t: s.intentSnap,
                hint: s.intentSnapHint,
              },
              { v: "other", t: s.intentOther, hint: "" },
            ].map((o, i) => (
              <label
                key={o.v}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 hover:bg-section has-[:checked]:border-forest has-[:checked]:bg-forest-subtle"
              >
                <input
                  type="radio"
                  name="intent"
                  value={o.v}
                  defaultChecked={i === 0}
                  className="mt-1 accent-[var(--color-forest)]"
                />
                <span className="text-sm text-ink">
                  {o.t}
                  {o.hint ? <span className="block text-xs text-body mt-0.5">{o.hint}</span> : null}
                </span>
              </label>
            ))}
          </fieldset>
          <Button type="submit" className="w-full">
            {s.continueBtn} <ArrowRight />
          </Button>
        </form>
      </Shell>
    );
  }

  // ---- PII (Section 1) + contact ----
  if (step === "pii") {
    return (
      <Shell>
        <StepHint index={1} />
        <h1 className="text-[28px] font-semibold leading-tight text-ink">{s.piiTitle}</h1>
        <p className="mt-2 text-body">{s.piiSubhead}</p>
        <form action={submitPii} className="mt-6 space-y-4">
          <NameFields
            defaultFirst={firstName}
            defaultLast={lastName}
            labelFirst={s.firstNameLabel}
            labelLast={s.lastNameLabel}
          />
          <div className="space-y-1.5">
            <Label htmlFor="phone">{s.mobileLabel}</Label>
            <PhoneInput defaultValue={phone ?? ""} />
            <p className="text-xs text-meta">{s.mobileHint}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="case_number">{s.caseLabel}</Label>
              <Input id="case_number" name="case_number" required defaultValue={caseNumber ?? ""} inputMode="numeric" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dob">{s.dobLabel}</Label>
              <DobInput defaultValue={dob ?? ""} />
            </div>
          </div>
          <AddressFields
            defaultLine1={addr.line1}
            defaultLine2={addr.line2 ?? ""}
            defaultCity={addr.city}
            defaultState={addr.state}
            defaultZip={addr.zip}
            labelStreet={s.streetLabel}
            labelApt={s.aptLabel}
            labelCity={s.cityLabel}
            labelZip={s.zipLabel}
          />
          <Button type="submit" className="w-full">
            {s.continueBtn} <ArrowRight />
          </Button>
        </form>
      </Shell>
    );
  }

  // ---- ORG PICK ----
  if (step === "orgpick") {
    const orgs = (await db.prepare("SELECT * FROM orgs ORDER BY name").all<Org>()).results ?? [];
    return (
      <Shell>
        <h1 className="text-[28px] font-semibold leading-tight text-ink">{s.orgPickTitle}</h1>
        <form action={submitOrgPick} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="org_choice">{s.orgLabel}</Label>
            <select id="org_choice" name="org_choice" className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink">
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
              <option value="__new__">{s.orgNotListed}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org_role">{s.orgRoleLabel}</Label>
            <select id="org_role" name="org_role" className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink">
              <option value="reviewer">{s.roleReviewer}</option>
              <option value="org_admin">{s.roleAdmin}</option>
            </select>
          </div>
          <details className="rounded-md border border-line p-3">
            <summary className="cursor-pointer text-sm font-medium text-ink">{s.newOrgSection}</summary>
            <div className="mt-3 space-y-3">
              <Input name="new_org_name" placeholder={s.newOrgNamePlaceholder} />
              <Input name="new_org_ein" placeholder={s.newOrgEinPlaceholder} />
              <Input name="new_org_contact" type="email" placeholder={s.newOrgContactPlaceholder} />
              <p className="text-xs text-meta">{s.newOrgHint}</p>
            </div>
          </details>
          <Button type="submit" className="w-full">{s.continueBtn} <ArrowRight /></Button>
        </form>
      </Shell>
    );
  }

  // ---- WELCOME ----
  return (
    <Shell>
      <div className="flex flex-col items-center py-4 text-center">
        <CheckCircle2 className="size-12 text-forest" strokeWidth={1.5} />
        <h1 className="mt-4 text-[28px] font-semibold text-ink">
          {s.welcomeTitle} {user.full_name?.split(" ")[0]}
        </h1>
        <p className="mt-2 max-w-sm text-body">
          {user.intent === "snap_cert" ? s.welcomeSnapBody : s.welcomeVolunteerBody}
        </p>
        <Button asChild className="mt-6">
          <Link href="/app">{s.welcomeBtn} <ArrowRight /></Link>
        </Button>
      </div>
    </Shell>
  );
}
