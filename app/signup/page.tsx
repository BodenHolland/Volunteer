import Link from "next/link";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from "@/app/auth-actions";
import { getDict } from "@/lib/i18n";
import { FirebaseAuthForm } from "@/components/firebase-auth-form";

export const metadata = { title: "Create account — Tended" };

const ERRORS: Record<string, string> = {
  name: "Please enter your name.",
  email: "Enter a valid email address.",
  password: "Use a password of at least 10 characters.",
  taken: "An account with that email already exists.",
};

export const dynamic = "force-dynamic";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const { t } = await getDict();
  const a = t.auth;
  const useFirebase = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  return (
    <AuthShell
      title={a.signupTitle}
      subtitle={a.signupSubtitle}
      footer={
        <span>
          {a.haveAccount}{" "}
          <Link href="/login" className="font-medium text-forest hover:underline">{a.signInTitle}</Link>
        </span>
      }
    >
      {useFirebase ? (
        <FirebaseAuthForm mode="signup" />
      ) : (
      <form action={signup} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">{a.yourName}</Label>
          <Input id="full_name" name="full_name" required autoFocus leadingIcon={<UserIcon />} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{a.email}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required leadingIcon={<Mail />} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{a.password}</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} leadingIcon={<Lock />} />
          <p className="text-xs text-meta">{a.passwordHint}</p>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-ink">{a.here}</legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 hover:bg-section has-[:checked]:border-forest has-[:checked]:bg-forest-subtle">
            <input type="radio" name="role" value="recipient" defaultChecked className="mt-1 accent-[var(--color-forest)]" />
            <span className="text-sm text-ink">{a.roleRecipient} <span className="text-meta">{a.roleRecipientHint}</span></span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 hover:bg-section has-[:checked]:border-forest has-[:checked]:bg-forest-subtle">
            <input type="radio" name="role" value="org_member" className="mt-1 accent-[var(--color-forest)]" />
            <span className="text-sm text-ink">{a.roleOrg} <span className="text-meta">{a.roleOrgHint}</span></span>
          </label>
        </fieldset>
        {sp.error && <p className="text-sm text-brick" role="alert">{ERRORS[sp.error] ?? "Something went wrong."}</p>}
        <Button type="submit" className="w-full">{a.createBtn}</Button>
        <p className="text-center text-xs text-meta">{a.legalNote}</p>
      </form>
      )}
    </AuthShell>
  );
}
