import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Phone, Upload, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDb } from "@/lib/cf";
import { homeForUser, requireUser } from "@/lib/session";
import { parseJson, type Address, type Org } from "@/lib/types";
import {
  submitLocation,
  submitPhone,
  submitPii,
  submitBenefitsCal,
  submitOrgPick,
} from "./actions";

export const metadata = { title: "Finish setting up — Tended" };

const ROLE_STEPS = ["Location", "Verify", "Details", "Benefits", "Done"];

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

function StepHint({ index }: { index: number }) {
  return (
    <p className="overline mb-2">
      Step {index + 1} of {ROLE_STEPS.length} · {ROLE_STEPS[index]}
    </p>
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

  // Skip onboarding entirely if the user has already finished it. Without this
  // guard, any link back to /start (preview "Sign in to commit", "Switch identity",
  // a stale bookmark) re-runs the wizard.
  const isOnboarded =
    user.role === "org_member"
      ? !!user.org_id
      : !!user.city && !!user.state && user.intent !== "n/a";
  if (!sp.step && isOnboarded) {
    redirect(homeForUser(user));
  }

  // Onboarding operates on the signed-in account. Route unspecified visits.
  const step = sp.step ?? (user.role === "org_member" ? "orgpick" : "location");

  const addr = parseJson<Address>(user.address_json, {
    line1: "",
    city: "",
    state: "CA",
    zip: "",
  });

  // ---- LOCATION + INTENT ----
  if (step === "location") {
    return (
      <Shell>
        <StepHint index={0} />
        <h1 className="text-[28px] font-semibold leading-tight text-ink">Where and why</h1>
        <form action={submitLocation} className="mt-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" required defaultValue={addr.city} placeholder="Your city" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" required defaultValue={addr.state} maxLength={2} />
            </div>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-ink">What brings you here?</legend>
            {[
              { v: "casual_volunteer", t: "I just want to volunteer", hint: "" },
              {
                v: "snap_cert",
                t: "I want to volunteer and certify hours toward the SNAP work requirement",
                hint: "For ABAWDs (Able-Bodied Adults Without Dependents). Your state may call SNAP CalFresh, Lone Star, ACCESS, etc.",
              },
              { v: "other", t: "Something else", hint: "" },
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
                  {o.hint ? <span className="block text-xs text-muted mt-0.5">{o.hint}</span> : null}
                </span>
              </label>
            ))}
          </fieldset>
          <Button type="submit" className="w-full">
            Continue <ArrowRight />
          </Button>
        </form>
      </Shell>
    );
  }

  // ---- PHONE / OTP ----
  if (step === "phone") {
    return (
      <Shell>
        <StepHint index={1} />
        <h1 className="text-[28px] font-semibold leading-tight text-ink">Verify your phone</h1>
        <p className="mt-2 text-body">
          We use this only to fill out your CF 888 when you certify hours. We don&apos;t share it with
          the state — you upload the form to your benefits portal yourself.
        </p>
        <form action={submitPhone} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Mobile number</Label>
            <Input id="phone" name="phone" type="tel" leadingIcon={<Phone />} defaultValue={user.phone ?? ""} placeholder="(916) 555-0142" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="code">6-digit code</Label>
            <Input id="code" name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} required placeholder="123456" />
            <p className="text-xs text-meta">Demo: use 123456.</p>
            {sp.error === "code" && <p className="text-sm text-brick">Enter a 6-digit code.</p>}
          </div>
          <Button type="submit" className="w-full">
            Verify <ArrowRight />
          </Button>
        </form>
      </Shell>
    );
  }

  // ---- PII (Section 1) ----
  if (step === "pii") {
    return (
      <Shell>
        <StepHint index={2} />
        <h1 className="text-[28px] font-semibold leading-tight text-ink">Your SNAP details</h1>
        <p className="mt-2 text-body">This appears on your CF 888 exactly as entered.</p>
        <form action={submitPii} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="legal_name">Legal name</Label>
            <Input id="legal_name" name="legal_name" required defaultValue={user.legal_name ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="case_number">Case number</Label>
              <Input id="case_number" name="case_number" required defaultValue={user.case_number ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dob">Date of birth</Label>
              <Input id="dob" name="dob" type="date" required defaultValue={user.dob ?? ""} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="line1">Street address</Label>
            <Input id="line1" name="line1" required defaultValue={addr.line1} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="line2">Apt / unit</Label>
              <Input id="line2" name="line2" defaultValue={addr.line2 ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city2">City</Label>
              <Input id="city2" name="city" defaultValue={addr.city} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" name="zip" required defaultValue={addr.zip} />
            </div>
          </div>
          <input type="hidden" name="state" value="CA" />
          <Button type="submit" className="w-full">
            Continue <ArrowRight />
          </Button>
        </form>
      </Shell>
    );
  }

  // ---- BENEFITSCAL SCREENSHOT ----
  if (step === "benefitscal") {
    return (
      <Shell>
        <StepHint index={3} />
        <h1 className="text-[28px] font-semibold leading-tight text-ink">Upload a benefits screenshot</h1>
        <p className="mt-2 text-body">
          A screenshot of your SNAP benefits account confirms your enrollment. We don&apos;t run OCR in
          this demo — any image works.
        </p>
        <form action={submitBenefitsCal} className="mt-6 space-y-4" encType="multipart/form-data">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-section py-10 text-center hover:bg-forest-subtle">
            <Upload className="size-6 text-meta" />
            <span className="text-sm font-medium text-ink">Choose an image</span>
            <span className="text-xs text-meta">PNG or JPG</span>
            <input type="file" name="screenshot" accept="image/*" className="sr-only" />
          </label>
          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              Upload and continue <ArrowRight />
            </Button>
            <Button type="submit" variant="secondary" name="screenshot" value="">
              Skip
            </Button>
          </div>
        </form>
      </Shell>
    );
  }

  // ---- ORG PICK ----
  if (step === "orgpick") {
    const orgs = (await db.prepare("SELECT * FROM orgs ORDER BY name").all<Org>()).results ?? [];
    return (
      <Shell>
        <p className="overline mb-2">For nonprofits</p>
        <h1 className="text-[28px] font-semibold leading-tight text-ink">Join your organization</h1>
        <form action={submitOrgPick} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="org_choice">Organization</Label>
            <select id="org_choice" name="org_choice" className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink">
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
              <option value="__new__">My org isn&apos;t listed…</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org_role">Your role</Label>
            <select id="org_role" name="org_role" className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink">
              <option value="reviewer">Reviewer — review and approve submissions</option>
              <option value="org_admin">Admin — also manage tasks and profile</option>
            </select>
          </div>
          <details className="rounded-md border border-line p-3">
            <summary className="cursor-pointer text-sm font-medium text-ink">New organization details</summary>
            <div className="mt-3 space-y-3">
              <Input name="new_org_name" placeholder="Organization name" />
              <Input name="new_org_ein" placeholder="EIN (00-0000000)" />
              <Input name="new_org_contact" type="email" placeholder="Contact email" />
              <p className="text-xs text-meta">Only used if you chose &quot;My org isn&apos;t listed.&quot;</p>
            </div>
          </details>
          <Button type="submit" className="w-full">Continue <ArrowRight /></Button>
        </form>
      </Shell>
    );
  }

  // ---- WELCOME ----
  return (
    <Shell>
      <div className="flex flex-col items-center py-4 text-center">
        <CheckCircle2 className="size-12 text-forest" strokeWidth={1.5} />
        <h1 className="mt-4 text-[28px] font-semibold text-ink">You&apos;re all set, {user.full_name?.split(" ")[0]}</h1>
        <p className="mt-2 max-w-sm text-body">
          {user.intent === "snap_cert"
            ? "Your details are saved. Browse tasks, log your hours, and certify them when you're ready."
            : "Your account is ready. Find a task near you and start helping."}
        </p>
        <Button asChild className="mt-6">
          <Link href="/app">Go to your dashboard <ArrowRight /></Link>
        </Button>
      </div>
    </Shell>
  );
}
