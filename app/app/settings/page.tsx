import { CheckCircle2, LogOut, Bell, Download } from "lucide-react";
import { signOut } from "@/app/auth-actions";
import { requireRecipient } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAccount, updateIntent, updateNotifyPrefs, deleteAccount } from "./actions";
import { parseNotifyPrefs } from "./notify-prefs";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings — Tended" };

const INTENT_VALUES = ["snap_cert", "casual_volunteer", "other"] as const;
const NOTIFY_NAMES = ["submission_updates", "cf888_ready"] as const;

const COPY = {
  en: {
    accountOverline: "Account",
    settingsHeading: "Settings",
    settingsSubhead: "Manage your account and how you use Tended.",
    saved: "Saved",
    accountSection: "Account",
    email: "Email",
    phone: "Phone",
    saveAccount: "Save account",
    howYouUse: "How you use Tended",
    intent: "Intent",
    intentHint: "Choosing “Certify SNAP hours” unlocks your CF 888 profile.",
    saveIntent: "Save intent",
    emailNotifications: "Email notifications",
    savePreferences: "Save preferences",
    yourData: "Your data",
    yourDataBody: "Download a copy of your account, submissions, and certified hours as a JSON file.",
    exportMyData: "Export my data",
    dangerZone: "Danger zone",
    signOut: "Sign out",
    deleteAccount: "Delete account",
    deleteBody:
      "This permanently removes your personal information (legal name, case number, address, date of birth, phone), signs you out everywhere, and disables sign-in. Your submission history is retained in anonymized form. This cannot be undone.",
    confirmError: "Type DELETE exactly to confirm account deletion.",
    typeDelete: "Type DELETE to confirm",
    intents: {
      snap_cert: "Certify SNAP hours",
      casual_volunteer: "Volunteer only",
      other: "Other",
    },
    notify: {
      submission_updates: {
        label: "When a submission is reviewed",
        description: "Get an email when work is approved, rejected, or needs changes.",
      },
      cf888_ready: {
        label: "When a CF 888 is ready",
        description: "Get an email when this month's certified hours can be downloaded.",
      },
    },
  },
  es: {
    accountOverline: "Cuenta",
    settingsHeading: "Configuración",
    settingsSubhead: "Administra tu cuenta y cómo usas Tended.",
    saved: "Guardado",
    accountSection: "Cuenta",
    email: "Correo electrónico",
    phone: "Teléfono",
    saveAccount: "Guardar cuenta",
    howYouUse: "Cómo usas Tended",
    intent: "Propósito",
    intentHint: "Elegir “Certificar horas de SNAP” desbloquea tu perfil de CF 888.",
    saveIntent: "Guardar propósito",
    emailNotifications: "Notificaciones por correo",
    savePreferences: "Guardar preferencias",
    yourData: "Tus datos",
    yourDataBody: "Descarga una copia de tu cuenta, tus envíos y tus horas certificadas como archivo JSON.",
    exportMyData: "Exportar mis datos",
    dangerZone: "Zona de peligro",
    signOut: "Cerrar sesión",
    deleteAccount: "Eliminar cuenta",
    deleteBody:
      "Esto elimina permanentemente tu información personal (nombre legal, número de caso, dirección, fecha de nacimiento, teléfono), cierra tu sesión en todas partes y desactiva el inicio de sesión. Tu historial de envíos se conserva de forma anónima. Esto no se puede deshacer.",
    confirmError: "Escribe DELETE exactamente para confirmar la eliminación de la cuenta.",
    typeDelete: "Escribe DELETE para confirmar",
    intents: {
      snap_cert: "Certificar horas de SNAP",
      casual_volunteer: "Solo voluntariado",
      other: "Otro",
    },
    notify: {
      submission_updates: {
        label: "Cuando se revisa un envío",
        description: "Recibe un correo cuando un trabajo sea aprobado, rechazado o necesite cambios.",
      },
      cf888_ready: {
        label: "Cuando un CF 888 esté listo",
        description: "Recibe un correo cuando las horas certificadas de este mes se puedan descargar.",
      },
    },
  },
} as const;

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
  const locale = await getLocale();
  const c = COPY[locale];

  // notify_prefs_json isn't on the User type yet (migration 0003); read directly.
  const prefsRow = await getDb()
    .prepare("SELECT notify_prefs_json FROM users WHERE id = ?")
    .bind(user.id)
    .first<{ notify_prefs_json: string | null }>();
  const prefs = parseNotifyPrefs(prefsRow?.notify_prefs_json);

  return (
    <div className="max-w-[900px] space-y-5">
      <div className="border-l-4 border-teal bg-white px-5 py-5 md:px-6">
        <p className="overline mb-2 text-teal">{c.accountOverline}</p>
        <h1 className="service-heading text-[28px]">{c.settingsHeading}</h1>
        <p className="mt-1 text-body">{c.settingsSubhead}</p>
      </div>

      {/* Account */}
      <section className="service-panel space-y-4 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">{c.accountSection}</h2>
          {saved === "account" && <Saved>{c.saved}</Saved>}
        </div>
        <form action={updateAccount} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{c.email}</Label>
            <Input id="email" name="email" type="email" defaultValue={user.email} autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{c.phone}</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ""} autoComplete="tel" />
          </div>
          <Button type="submit" size="sm">{c.saveAccount}</Button>
        </form>
      </section>

      {/* Intent */}
      <section className="service-panel space-y-4 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">{c.howYouUse}</h2>
          {saved === "intent" && <Saved>{c.saved}</Saved>}
        </div>
        <form action={updateIntent} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="intent">{c.intent}</Label>
            <select
              id="intent"
              name="intent"
              defaultValue={user.intent === "n/a" ? "other" : user.intent}
              className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
            >
              {INTENT_VALUES.map((v) => (
                <option key={v} value={v}>{c.intents[v]}</option>
              ))}
            </select>
            <p className="text-xs text-meta">{c.intentHint}</p>
          </div>
          <Button type="submit" size="sm">{c.saveIntent}</Button>
        </form>
      </section>

      {/* Notifications */}
      <section className="service-panel space-y-4 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-meta" />
            <h2 className="text-base font-semibold text-ink">{c.emailNotifications}</h2>
          </div>
          {saved === "notifications" && <Saved>{c.saved}</Saved>}
        </div>
        <form action={updateNotifyPrefs} className="space-y-4">
          <div className="space-y-3">
            {NOTIFY_NAMES.map((name) => (
              <label key={name} className="flex cursor-pointer items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">{c.notify[name].label}</span>
                  <span className="block text-xs text-meta">{c.notify[name].description}</span>
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
          <Button type="submit" size="sm">{c.savePreferences}</Button>
        </form>
      </section>

      {/* Data export */}
      <section className="service-panel space-y-4 p-5 md:p-6">
        <h2 className="text-base font-semibold text-ink">{c.yourData}</h2>
        <p className="text-sm text-body">
          {c.yourDataBody}
        </p>
        <Button asChild variant="secondary" size="sm">
          <a href="/app/settings/export" download>
            <Download /> {c.exportMyData}
          </a>
        </Button>
      </section>

      {/* Danger zone */}
      <section className="service-panel space-y-4 border-brick/30 p-5 md:p-6">
        <h2 className="text-base font-semibold text-ink">{c.dangerZone}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <form action={signOut}>
            <Button type="submit" variant="destructive"><LogOut /> {c.signOut}</Button>
          </form>
        </div>

        <div className="space-y-3 rounded-md border border-brick/30 bg-brick-subtle/40 p-4">
          <p className="text-sm font-medium text-ink">{c.deleteAccount}</p>
          <p className="text-xs text-body">
            {c.deleteBody}
          </p>
          {error === "confirm" && (
            <p className="text-xs font-medium text-brick">
              {c.confirmError}
            </p>
          )}
          <form action={deleteAccount} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-xs">{c.typeDelete}</Label>
              <Input
                id="confirm"
                name="confirm"
                autoComplete="off"
                placeholder="DELETE"
                className="w-40"
              />
            </div>
            <Button type="submit" variant="destructive">{c.deleteAccount}</Button>
          </form>
        </div>
      </section>
    </div>
  );
}
