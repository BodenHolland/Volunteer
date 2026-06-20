import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/app/auth-actions";
import { getDb } from "@/lib/cf";
import { ensureSeeded } from "@/lib/seed";

export const metadata = { title: "Sign in — Tended" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string; verified?: string; next?: string }>;
}) {
  const sp = await searchParams;
  // First-run bootstrap so a fresh deploy has the demo accounts to sign in with.
  await ensureSeeded(getDb());
  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back. Sign in to continue your civic work."
      footer={
        <span>
          New here?{" "}
          <Link href="/signup" className="font-medium text-forest hover:underline">Create an account</Link>
        </span>
      }
    >
      {sp.reset && <p className="mb-4 rounded-md bg-forest-subtle px-3 py-2 text-sm text-forest">Your password was reset. Sign in with your new password.</p>}
      {sp.verified && <p className="mb-4 rounded-md bg-forest-subtle px-3 py-2 text-sm text-forest">Your email is verified.</p>}
      <form action={login} className="space-y-4">
        <input type="hidden" name="next" value={sp.next ?? ""} />
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required autoFocus leadingIcon={<Mail />} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-sm font-medium text-forest hover:underline">Forgot?</Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" required leadingIcon={<Lock />} />
        </div>
        {sp.error === "locked" ? (
          <p className="text-sm text-brick" role="alert">Too many attempts. Try again in a few minutes.</p>
        ) : sp.error ? (
          <p className="text-sm text-brick" role="alert">That email and password don&apos;t match.</p>
        ) : null}
        <Button type="submit" className="w-full">Sign in</Button>
      </form>
    </AuthShell>
  );
}
