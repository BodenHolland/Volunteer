import Link from "next/link";
import { Lock } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/app/auth-actions";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "Set a new password — Tended" };

export const dynamic = "force-dynamic";

const COPY = {
  en: {
    expiredTitle: "Link expired",
    expiredSubtitle: "That reset link is invalid or has already been used.",
    requestNew: "Request a new link",
    expiredBody: "Reset links are single-use and expire after an hour.",
    title: "Set a new password",
    subtitle: "Choose a new password for your account.",
    newPassword: "New password",
    passwordHint: "At least 10 characters.",
    passwordError: "Use at least 10 characters.",
    updatePassword: "Update password",
  },
  es: {
    expiredTitle: "El enlace caducó",
    expiredSubtitle: "Ese enlace de restablecimiento no es válido o ya se usó.",
    requestNew: "Solicitar un enlace nuevo",
    expiredBody: "Los enlaces de restablecimiento son de un solo uso y caducan después de una hora.",
    title: "Establece una nueva contraseña",
    subtitle: "Elige una nueva contraseña para tu cuenta.",
    newPassword: "Nueva contraseña",
    passwordHint: "Al menos 10 caracteres.",
    passwordError: "Usa al menos 10 caracteres.",
    updatePassword: "Actualizar contraseña",
  },
} as const;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();
  const c = COPY[locale];
  if (sp.error === "invalid" || !sp.token) {
    return (
      <AuthShell
        title={c.expiredTitle}
        subtitle={c.expiredSubtitle}
        footer={<Link href="/forgot-password" className="font-medium text-forest hover:underline">{c.requestNew}</Link>}
      >
        <p className="text-sm text-body">{c.expiredBody}</p>
      </AuthShell>
    );
  }
  return (
    <AuthShell title={c.title} subtitle={c.subtitle}>
      <form action={resetPassword} className="space-y-4">
        <input type="hidden" name="token" value={sp.token} />
        <div className="space-y-1.5">
          <Label htmlFor="password">{c.newPassword}</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} autoFocus leadingIcon={<Lock />} />
          <p className="text-xs text-meta">{c.passwordHint}</p>
        </div>
        {sp.error === "password" && <p className="text-sm text-brick">{c.passwordError}</p>}
        <Button type="submit" className="w-full">{c.updatePassword}</Button>
      </form>
    </AuthShell>
  );
}
