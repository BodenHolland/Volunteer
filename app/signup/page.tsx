import Link from "next/link";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from "@/app/auth-actions";

export const metadata = { title: "Create account — Tended" };

const ERRORS: Record<string, string> = {
  name: "Please enter your name.",
  email: "Enter a valid email address.",
  password: "Use a password of at least 10 characters.",
  taken: "An account with that email already exists.",
};

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start doing civic work in your neighborhood."
      footer={
        <span>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-forest hover:underline">Sign in</Link>
        </span>
      }
    >
      <form action={signup} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Your name</Label>
          <Input id="full_name" name="full_name" required autoFocus leadingIcon={<UserIcon />} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required leadingIcon={<Mail />} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} leadingIcon={<Lock />} />
          <p className="text-xs text-meta">At least 10 characters.</p>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-ink">I&apos;m here to…</legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 hover:bg-section has-[:checked]:border-forest has-[:checked]:bg-forest-subtle">
            <input type="radio" name="role" value="recipient" defaultChecked className="mt-1 accent-[var(--color-forest)]" />
            <span className="text-sm text-ink">Do civic work <span className="text-meta">— pick tasks and help your community</span></span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 hover:bg-section has-[:checked]:border-forest has-[:checked]:bg-forest-subtle">
            <input type="radio" name="role" value="org_member" className="mt-1 accent-[var(--color-forest)]" />
            <span className="text-sm text-ink">Host tasks for a nonprofit <span className="text-meta">— review and certify work</span></span>
          </label>
        </fieldset>
        {sp.error && <p className="text-sm text-brick" role="alert">{ERRORS[sp.error] ?? "Something went wrong."}</p>}
        <Button type="submit" className="w-full">Create account</Button>
        <p className="text-center text-xs text-meta">
          By creating an account you confirm Tended pays you nothing and only the County decides eligibility.
        </p>
      </form>
    </AuthShell>
  );
}
