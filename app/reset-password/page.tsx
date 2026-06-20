import Link from "next/link";
import { Lock } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/app/auth-actions";

export const metadata = { title: "Set a new password — Tended" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const sp = await searchParams;
  if (sp.error === "invalid" || !sp.token) {
    return (
      <AuthShell
        title="Link expired"
        subtitle="That reset link is invalid or has already been used."
        footer={<Link href="/forgot-password" className="font-medium text-forest hover:underline">Request a new link</Link>}
      >
        <p className="text-sm text-body">Reset links are single-use and expire after an hour.</p>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Set a new password" subtitle="Choose a new password for your account.">
      <form action={resetPassword} className="space-y-4">
        <input type="hidden" name="token" value={sp.token} />
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} autoFocus leadingIcon={<Lock />} />
          <p className="text-xs text-meta">At least 10 characters.</p>
        </div>
        {sp.error === "password" && <p className="text-sm text-brick">Use at least 10 characters.</p>}
        <Button type="submit" className="w-full">Update password</Button>
      </form>
    </AuthShell>
  );
}
