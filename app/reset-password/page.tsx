import Link from "next/link";
import { Lock } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/app/auth-actions";
import { getDict } from "@/lib/i18n";

export const metadata = { title: "Set a new password | colift" };

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const { locale, t } = await getDict();
  if (sp.error === "invalid" || !sp.token) {
    return (
      <AuthShell
        title={t.resetPassword.expiredTitle}
        subtitle={t.resetPassword.expiredSubtitle}
        footer={<Link href="/forgot-password" className="font-medium text-forest hover:underline">{t.resetPassword.requestNew}</Link>}
      >
        <p className="text-sm text-body">{t.resetPassword.expiredBody}</p>
      </AuthShell>
    );
  }
  return (
    <AuthShell title={t.resetPassword.title} subtitle={t.resetPassword.subtitle}>
      <form action={resetPassword} className="space-y-4">
        <input type="hidden" name="token" value={sp.token} />
        <div className="space-y-1.5">
          <Label htmlFor="password">{t.resetPassword.newPassword}</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} autoFocus leadingIcon={<Lock />} />
          <p className="text-xs text-meta">{t.resetPassword.passwordHint}</p>
        </div>
        {sp.error === "password" && <p className="text-sm text-brick">{t.resetPassword.passwordError}</p>}
        <Button type="submit" className="w-full">{t.resetPassword.updatePassword}</Button>
      </form>
    </AuthShell>
  );
}
