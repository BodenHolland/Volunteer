import Link from "next/link";
import { CheckCircle2, LogOut, Bell, Download } from "lucide-react";
import { requireRecipient } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAccount, updateIntent, updateNotifyPrefs, deleteAccount } from "./actions";
import { parseNotifyPrefs } from "./notify-prefs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings — Tended" };

const INTENTS = [
  { value: "snap_cert", label: "Certify SNAP hours" },
  { value: "casual_volunteer", label: "Volunteer only" },
  { value: "other", label: "Other" },
];

const NOTIFY_OPTIONS = [
  {
    name: "submission_updates",
    label: "When a submission is reviewed",
    description: "Get an email when work is approved, rejected, or needs changes.",
  },
  {
    name: "cf888_ready",
    label: "When a CF 888 is ready",
    description: "Get an email when this month's certified hours can be downloaded.",
  },
] as const;

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
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireRecipient();
  const { saved, error } = await searchParams;

  // notify_prefs_json isn't on the User type yet (migration 0003); read directly.
  const prefsRow = await getDb()
    .prepare("SELECT notify_prefs_json FROM users WHERE id = ?")
    .bind(user.id)
    .first<{ notify_prefs_json: string | null }>();
  const prefs = parseNotifyPrefs(prefsRow?.notify_prefs_json);

  return (
    <div className="max-w-[900px] space-y-5">
      <div className="border-l-4 border-teal bg-white px-5 py-5 md:px-6">
        <p className="overline mb-2 text-teal">Account</p>
        <h1 className="service-heading text-[28px]">Settings</h1>
        <p className="mt-1 text-body">Manage your account and how you use Tended.</p>
      </div>

      {/* Account */}
      <section className="service-panel space-y-4 p-5 md:p-6">
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
      <section className="service-panel space-y-4 p-5 md:p-6">
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
            <p className="text-xs text-meta">Choosing &ldquo;Certify SNAP hours&rdquo; unlocks your CF 888 profile.</p>
          </div>
          <Button type="submit" size="sm">Save intent</Button>
        </form>
      </section>

      {/* Notifications */}
      <section className="service-panel space-y-4 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-meta" />
            <h2 className="text-base font-semibold text-ink">Email notifications</h2>
          </div>
          {saved === "notifications" && <Saved>Saved</Saved>}
        </div>
        <form action={updateNotifyPrefs} className="space-y-4">
          <div className="space-y-3">
            {NOTIFY_OPTIONS.map((opt) => (
              <label key={opt.name} className="flex cursor-pointer items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">{opt.label}</span>
                  <span className="block text-xs text-meta">{opt.description}</span>
                </span>
                <input
                  type="checkbox"
                  name={opt.name}
                  defaultChecked={prefs[opt.name]}
                  className="mt-0.5 size-4 shrink-0 accent-forest"
                />
              </label>
            ))}
          </div>
          <Button type="submit" size="sm">Save preferences</Button>
        </form>
      </section>

      {/* Data export */}
      <section className="service-panel space-y-4 p-5 md:p-6">
        <h2 className="text-base font-semibold text-ink">Your data</h2>
        <p className="text-sm text-body">
          Download a copy of your account, submissions, and certified hours as a JSON file.
        </p>
        <Button asChild variant="secondary" size="sm">
          <a href="/app/settings/export" download>
            <Download /> Export my data
          </a>
        </Button>
      </section>

      {/* Danger zone */}
      <section className="service-panel space-y-4 border-brick/30 p-5 md:p-6">
        <h2 className="text-base font-semibold text-ink">Danger zone</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="destructive">
            <Link href="/signout"><LogOut /> Sign out</Link>
          </Button>
        </div>

        <div className="space-y-3 rounded-md border border-brick/30 bg-brick-subtle/40 p-4">
          <p className="text-sm font-medium text-ink">Delete account</p>
          <p className="text-xs text-body">
            This permanently removes your personal information (legal name, case number,
            address, date of birth, phone), signs you out everywhere, and disables sign-in.
            Your submission history is retained in anonymized form. This cannot be undone.
          </p>
          {error === "confirm" && (
            <p className="text-xs font-medium text-brick">
              Type DELETE exactly to confirm account deletion.
            </p>
          )}
          <form action={deleteAccount} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-xs">Type DELETE to confirm</Label>
              <Input
                id="confirm"
                name="confirm"
                autoComplete="off"
                placeholder="DELETE"
                className="w-40"
              />
            </div>
            <Button type="submit" variant="destructive">Delete account</Button>
          </form>
        </div>
      </section>
    </div>
  );
}
