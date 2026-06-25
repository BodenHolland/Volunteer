import Link from "next/link";
import { CheckCircle2, LogOut, Bell, Download, ArrowRight, FileText } from "lucide-react";
import { signOut } from "@/app/auth-actions";
import { requireRecipient } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAccount, updateIntent, updateNotifyPrefs, deleteAccount } from "./actions";
import { parseNotifyPrefs } from "./notify-prefs";
import { getDict } from "@/lib/i18n";
import { monthLabel } from "@/lib/time";
import { decryptField } from "@/lib/crypto";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings | colift" };

const INTENT_VALUES = ["snap_cert", "casual_volunteer", "other"] as const;
const NOTIFY_NAMES = ["submission_updates", "cf888_ready"] as const;

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
  const { locale, t } = await getDict();

  const db = getDb();
  // notify_prefs_json isn't on the User type yet (migration 0003); read directly.
  const prefsRow = await db
    .prepare("SELECT notify_prefs_json FROM users WHERE id = ?")
    .bind(user.id)
    .first<{ notify_prefs_json: string | null }>();
  const prefs = parseNotifyPrefs(prefsRow?.notify_prefs_json);

  const phone = await decryptField(user.phone);
  const isSnap = user.intent === "snap_cert";
  const previousReports = isSnap
    ? (
        await db
          .prepare(
            "SELECT month, r2_key, generated_at FROM cf888_forms WHERE user_id = ? ORDER BY generated_at DESC LIMIT 24"
          )
          .bind(user.id)
          .all<{ month: string; r2_key: string; generated_at: number }>()
      ).results ?? []
    : [];

  const intentLabels: Record<typeof INTENT_VALUES[number], string> = {
    snap_cert: t.appSettings.intentSnapCert,
    casual_volunteer: t.appSettings.intentCasual,
    other: t.appSettings.intentOther,
  };

  const notifyConfig: Record<typeof NOTIFY_NAMES[number], { label: string; description: string }> = {
    submission_updates: {
      label: t.appSettings.notifySubmissionLabel,
      description: t.appSettings.notifySubmissionDesc,
    },
    cf888_ready: {
      label: t.appSettings.notifyCf888Label,
      description: t.appSettings.notifyCf888Desc,
    },
  };

  return (
    <div className="max-w-[900px] space-y-5">
      <div className="rounded-md border border-line bg-white px-5 py-5 md:px-6">
        <h1 className="service-heading text-[28px]">{t.appSettings.heading}</h1>
        <p className="mt-1 text-body">{t.appSettings.subhead}</p>
      </div>

      {/* Account */}
      <section className="service-panel space-y-4 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">{t.appSettings.accountSection}</h2>
          {saved === "account" && <Saved>{t.appSettings.saved}</Saved>}
        </div>
        <form action={updateAccount} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t.appSettings.email}</Label>
            <Input id="email" name="email" type="email" defaultValue={user.email} autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t.appSettings.phone}</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={phone ?? ""} autoComplete="tel" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="city">{t.appSettings.city}</Label>
              <Input id="city" name="city" defaultValue={user.city ?? ""} placeholder="San Francisco" autoComplete="address-level2" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">{t.appSettings.state}</Label>
              <Input id="state" name="state" defaultValue={user.state ?? ""} placeholder="CA" maxLength={2} autoComplete="address-level1" />
            </div>
          </div>
          <Button type="submit" size="sm">{t.appSettings.saveAccount}</Button>
        </form>
      </section>

      {/* Intent */}
      <section className="service-panel space-y-4 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">{t.appSettings.howYouUse}</h2>
          {saved === "intent" && <Saved>{t.appSettings.saved}</Saved>}
        </div>
        <form action={updateIntent} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="intent">{t.appSettings.intent}</Label>
            <select
              id="intent"
              name="intent"
              defaultValue={user.intent === "n/a" ? "other" : user.intent}
              className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
            >
              {INTENT_VALUES.map((v) => (
                <option key={v} value={v}>{intentLabels[v]}</option>
              ))}
            </select>
            <p className="text-xs text-meta">{t.appSettings.intentHint}</p>
          </div>
          <Button type="submit" size="sm">{t.appSettings.saveIntent}</Button>
        </form>
        {isSnap && (
          <Link
            href="/app/profile"
            className="-mx-5 flex items-center gap-3 border-t border-line px-5 py-4 transition-colors hover:bg-teal-subtle/60 md:-mx-6 md:px-6"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-forest-subtle text-forest">
              <FileText className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{t.appSettings.completeSnapProfile}</p>
              <p className="text-sm text-body">{t.appSettings.completeSnapProfileBody}</p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-meta" aria-label={t.appSettings.openSnapProfile} />
          </Link>
        )}
      </section>

      {/* Previous reports (snap_cert only) */}
      {isSnap && (
        <section className="service-panel space-y-3 p-5 md:p-6">
          <h2 className="text-base font-semibold text-ink">{t.appSettings.previousReports}</h2>
          {previousReports.length === 0 ? (
            <p className="text-sm text-body">{t.appSettings.previousReportsEmpty}</p>
          ) : (
            <ul className="divide-y divide-line">
              {previousReports.map((r) => (
                <li key={`${r.month}-${r.generated_at}`} className="flex items-center gap-3 py-3">
                  <FileText className="size-5 shrink-0 text-meta" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{monthLabel(r.month)}</p>
                  </div>
                  <Button asChild variant="secondary" size="sm">
                    <a href={`/api/files?key=${encodeURIComponent(r.r2_key)}`} target="_blank" rel="noreferrer">
                      <Download /> {t.appSettings.download}
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Notifications */}
      <section className="service-panel space-y-4 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-meta" />
            <h2 className="text-base font-semibold text-ink">{t.appSettings.emailNotifications}</h2>
          </div>
          {saved === "notifications" && <Saved>{t.appSettings.saved}</Saved>}
        </div>
        <form action={updateNotifyPrefs} className="space-y-4">
          <div className="space-y-3">
            {NOTIFY_NAMES.map((name) => (
              <label key={name} className="flex cursor-pointer items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">{notifyConfig[name].label}</span>
                  <span className="block text-xs text-meta">{notifyConfig[name].description}</span>
                </span>
                <input
                  type="checkbox"
                  name={name}
                  defaultChecked={prefs[name]}
                  className="mt-0.5 size-4 shrink-0 accent-forest"
                />
              </label>
            ))}
          </div>
          <Button type="submit" size="sm">{t.appSettings.savePreferences}</Button>
        </form>
      </section>

      {/* Data export */}
      <section className="service-panel space-y-4 p-5 md:p-6">
        <h2 className="text-base font-semibold text-ink">{t.appSettings.yourData}</h2>
        <p className="text-sm text-body">
          {t.appSettings.yourDataBody}
        </p>
        <Button asChild variant="secondary" size="sm">
          <a href="/app/settings/export" download>
            <Download /> {t.appSettings.exportMyData}
          </a>
        </Button>
      </section>

      {/* Danger zone */}
      <section className="service-panel space-y-4 border-brick/30 p-5 md:p-6">
        <h2 className="text-base font-semibold text-ink">{t.appSettings.dangerZone}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <form action={signOut}>
            <Button type="submit" variant="destructive"><LogOut /> {t.appSettings.signOut}</Button>
          </form>
        </div>

        <div className="space-y-3 rounded-md border border-brick/30 bg-brick-subtle/40 p-4">
          <p className="text-sm font-medium text-ink">{t.appSettings.deleteAccount}</p>
          <p className="text-xs text-body">
            {t.appSettings.deleteBody}
          </p>
          {error === "confirm" && (
            <p className="text-xs font-medium text-brick">
              {t.appSettings.confirmError}
            </p>
          )}
          <form action={deleteAccount} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-xs">{t.appSettings.typeDelete}</Label>
              <Input
                id="confirm"
                name="confirm"
                autoComplete="off"
                placeholder="DELETE"
                className="w-40"
              />
            </div>
            <Button type="submit" variant="destructive">{t.appSettings.deleteAccount}</Button>
          </form>
        </div>
      </section>
    </div>
  );
}
