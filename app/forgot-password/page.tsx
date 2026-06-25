import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/app/auth-actions";
import { getDict } from "@/lib/i18n";

export const metadata = { title: "Reset password | colift" };

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const sp = await searchParams;
  const { locale, t } = await getDict();
  if (sp.sent) {
    return (
      <AuthShell
        title={t.forgotPassword.sentTitle}
        subtitle={t.forgotPassword.sentSubtitle}
        footer={<Link href="/login" className="font-medium text-forest hover:underline">{t.forgotPassword.backToSignIn}</Link>}
      >
        <p className="text-sm text-body">
          {t.forgotPassword.didntGet}<Link href="/forgot-password" className="font-medium text-forest hover:underline">{t.forgotPassword.tryAgain}</Link>.
        </p>
      </AuthShell>
    );
  }
  return (
    <AuthShell
      title={t.forgotPassword.title}
      subtitle={t.forgotPassword.subtitle}
      footer={<Link href="/login" className="font-medium text-forest hover:underline">{t.forgotPassword.backToSignIn}</Link>}
    >
      <form action={forgotPassword} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t.forgotPassword.email}</Label>
          <Input id="email" name="email" type="email" required autoFocus leadingIcon={<Mail />} />
        </div>
        <Button type="submit" className="w-full">{t.forgotPassword.sendResetLink}</Button>
      </form>
    </AuthShell>
  );
}
