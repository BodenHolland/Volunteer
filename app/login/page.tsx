import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/app/auth-actions";
import { getDb } from "@/lib/cf";
import { ensureSeeded } from "@/lib/seed";
import { getDict } from "@/lib/i18n";
import { FirebaseAuthForm } from "@/components/firebase-auth-form";

export const metadata = { title: "Sign in — Tended" };

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string; verified?: string; next?: string }>;
}) {
  const sp = await searchParams;
  await ensureSeeded(getDb());
  const { t } = await getDict();
  const a = t.auth;
  const useFirebase = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  return (
    <AuthShell
      title={a.signInTitle}
      subtitle={a.signInSubtitle}
      footer={
        <span>
          {a.newHere}{" "}
          <Link href="/signup" className="font-medium text-forest hover:underline">{a.createAccount}</Link>
        </span>
      }
    >
      {sp.reset && <p className="mb-4 rounded-md bg-forest-subtle px-3 py-2 text-sm text-forest">Your password was reset. Sign in with your new password.</p>}
      {sp.verified && <p className="mb-4 rounded-md bg-forest-subtle px-3 py-2 text-sm text-forest">Your email is verified.</p>}
      {useFirebase ? (
        <FirebaseAuthForm mode="login" next={sp.next} />
      ) : (
      <form action={login} className="space-y-4">
        <input type="hidden" name="next" value={sp.next ?? ""} />
        <div className="space-y-1.5">
          <Label htmlFor="email">{a.email}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required autoFocus leadingIcon={<Mail />} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{a.password}</Label>
            <Link href="/forgot-password" className="text-sm font-medium text-forest hover:underline">{a.forgot}</Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" required leadingIcon={<Lock />} />
        </div>
        {sp.error === "locked" ? (
          <p className="text-sm text-brick" role="alert">{a.locked}</p>
        ) : sp.error ? (
          <p className="text-sm text-brick" role="alert">{a.badCreds}</p>
        ) : null}
        <Button type="submit" className="w-full">{a.signInBtn}</Button>
      </form>
      )}
    </AuthShell>
  );
}
