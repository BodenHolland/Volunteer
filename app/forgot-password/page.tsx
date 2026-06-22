import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/app/auth-actions";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "Reset password — Tended" };

export const dynamic = "force-dynamic";

const COPY = {
  en: {
    sentTitle: "Check your email",
    sentSubtitle:
      "If an account exists for that address, we've sent a link to reset your password. It expires in an hour.",
    backToSignIn: "Back to sign in",
    didntGet: "Didn't get it? Check spam, or ",
    tryAgain: "try again",
    title: "Reset your password",
    subtitle: "Enter your email and we'll send a reset link.",
    email: "Email",
    sendResetLink: "Send reset link",
  },
  es: {
    sentTitle: "Revisa tu correo",
    sentSubtitle:
      "Si existe una cuenta para esa dirección, te hemos enviado un enlace para restablecer tu contraseña. Caduca en una hora.",
    backToSignIn: "Volver a iniciar sesión",
    didntGet: "¿No lo recibiste? Revisa el spam, o ",
    tryAgain: "inténtalo de nuevo",
    title: "Restablece tu contraseña",
    subtitle: "Ingresa tu correo electrónico y te enviaremos un enlace para restablecerla.",
    email: "Correo electrónico",
    sendResetLink: "Enviar enlace de restablecimiento",
  },
} as const;

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const sp = await searchParams;
  const locale = await getLocale();
  const c = COPY[locale];
  if (sp.sent) {
    return (
      <AuthShell
        title={c.sentTitle}
        subtitle={c.sentSubtitle}
        footer={<Link href="/login" className="font-medium text-forest hover:underline">{c.backToSignIn}</Link>}
      >
        <p className="text-sm text-body">
          {c.didntGet}<Link href="/forgot-password" className="font-medium text-forest hover:underline">{c.tryAgain}</Link>.
        </p>
      </AuthShell>
    );
  }
  return (
    <AuthShell
      title={c.title}
      subtitle={c.subtitle}
      footer={<Link href="/login" className="font-medium text-forest hover:underline">{c.backToSignIn}</Link>}
    >
      <form action={forgotPassword} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{c.email}</Label>
          <Input id="email" name="email" type="email" required autoFocus leadingIcon={<Mail />} />
        </div>
        <Button type="submit" className="w-full">{c.sendResetLink}</Button>
      </form>
    </AuthShell>
  );
}
