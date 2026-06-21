import Link from "next/link";
import { CheckCircle2, Info, Settings } from "lucide-react";
import { requireRecipient } from "@/lib/session";
import { decryptField } from "@/lib/crypto";
import { parseJson, type Address } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "SNAP profile — Tended" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireRecipient();
  const { saved } = await searchParams;

  if (user.intent !== "snap_cert") {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="text-[28px] font-semibold text-ink">SNAP profile</h1>
        <div className="rounded-lg border border-line bg-section p-5">
          <p className="flex items-center gap-2 font-medium text-ink">
            <Info className="size-5 text-forest" /> Only needed for certifying hours
          </p>
          <p className="mt-2 text-sm text-body">
            The SNAP profile holds the details that appear on your CF 888 form — it only
            applies to people certifying volunteer hours toward SNAP. You&apos;re set up to
            volunteer without certification, so there&apos;s nothing to fill in here.
          </p>
          <p className="mt-3 text-sm text-body">
            If that changes, you can switch your intent in{" "}
            <Link href="/app/settings" className="font-medium text-forest underline-offset-4 hover:underline">
              settings
            </Link>
            .
          </p>
          <Button asChild variant="secondary" className="mt-4">
            <Link href="/app/settings"><Settings /> Go to settings</Link>
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
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold text-ink">SNAP profile</h1>
        <p className="mt-1 text-body">This appears on your CF 888 exactly as entered.</p>
      </div>

      {saved === "1" && (
        <div className="flex items-center gap-2 rounded-lg border border-line bg-forest-subtle px-4 py-3 text-sm font-medium text-forest">
          <CheckCircle2 className="size-5" /> Profile saved.
        </div>
      )}

      <form action={updateProfile} className="space-y-6">
        <section className="space-y-4 rounded-lg border border-line bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Identity</h2>
          <div className="space-y-1.5">
            <Label htmlFor="legal_name">Legal name</Label>
            <Input id="legal_name" name="legal_name" defaultValue={legalName ?? ""} autoComplete="name" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="case_number">SNAP case number</Label>
              <Input id="case_number" name="case_number" defaultValue={caseNumber ?? ""} inputMode="numeric" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dob">Date of birth</Label>
              <Input id="dob" name="dob" type="date" defaultValue={dob ?? ""} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={phone ?? ""} autoComplete="tel" />
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-line bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Address</h2>
          <div className="space-y-1.5">
            <Label htmlFor="line1">Street address</Label>
            <Input id="line1" name="line1" defaultValue={addr.line1} autoComplete="address-line1" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="line2">Apartment, suite, etc. (optional)</Label>
            <Input id="line2" name="line2" defaultValue={addr.line2 ?? ""} autoComplete="address-line2" />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_5rem_7rem]">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={addr.city} autoComplete="address-level2" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" defaultValue={addr.state} maxLength={2} autoComplete="address-level1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" name="zip" defaultValue={addr.zip} inputMode="numeric" autoComplete="postal-code" />
            </div>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit">Save profile</Button>
          <p className="text-xs text-meta">Demo only — this data is not sent to any state system.</p>
        </div>
      </form>
    </div>
  );
}
