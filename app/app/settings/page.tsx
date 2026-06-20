import Link from "next/link";
import { CheckCircle2, LogOut, Bell } from "lucide-react";
import { requireRecipient } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAccount, updateIntent } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings — Tended" };

const INTENTS = [
  { value: "snap_cert", label: "Certify CalFresh hours" },
  { value: "casual_volunteer", label: "Volunteer only" },
  { value: "other", label: "Other" },
];

function Saved({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-sm font-medium text-forest">
      <CheckCircle2 className="size-4" /> {children}
    </p>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireRecipient();
  const { saved } = await searchParams;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold text-ink">Settings</h1>
        <p className="mt-1 text-body">Manage your account and how you use Tended.</p>
      </div>

      {/* Account */}
      <section className="space-y-4 rounded-lg border border-line bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Account</h2>
          {saved === "account" && <Saved>Saved</Saved>}
        </div>
        <form action={updateAccount} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={user.email} autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ""} autoComplete="tel" />
          </div>
          <Button type="submit" size="sm">Save account</Button>
        </form>
      </section>

      {/* Intent */}
      <section className="space-y-4 rounded-lg border border-line bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">How you use Tended</h2>
          {saved === "intent" && <Saved>Saved</Saved>}
        </div>
        <form action={updateIntent} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="intent">Intent</Label>
            <select
              id="intent"
              name="intent"
              defaultValue={user.intent === "n/a" ? "other" : user.intent}
              className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
            >
              {INTENTS.map((i) => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>
            <p className="text-xs text-meta">Choosing &ldquo;Certify CalFresh hours&rdquo; unlocks your CF 888 profile.</p>
          </div>
          <Button type="submit" size="sm">Save intent</Button>
        </form>
      </section>

      {/* Notifications */}
      <section className="space-y-4 rounded-lg border border-line bg-white p-5">
        <div className="flex items-center gap-2">
          <Bell className="size-5 text-meta" />
          <h2 className="text-base font-semibold text-ink">Email notifications — coming soon</h2>
        </div>
        <div className="space-y-3 opacity-60">
          {["When a submission is reviewed", "Monthly hours summary"].map((label) => (
            <label key={label} className="flex cursor-not-allowed items-center justify-between gap-3">
              <span className="text-sm text-body">{label}</span>
              <span className="inline-flex h-6 w-10 items-center rounded-full bg-line p-0.5">
                <span className="size-5 rounded-full bg-white shadow-sm" />
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Danger zone */}
      <section className="space-y-4 rounded-lg border border-brick/30 bg-white p-5">
        <h2 className="text-base font-semibold text-ink">Danger zone</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="destructive">
            <Link href="/signout"><LogOut /> Sign out</Link>
          </Button>
          <Button variant="destructive" disabled>Delete account</Button>
          <p className="text-xs text-meta">Account deletion is not available in the demo.</p>
        </div>
      </section>
    </div>
  );
}
