import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/app/auth-actions";

export const metadata = { title: "Reset password — Tended" };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const sp = await searchParams;
  if (sp.sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="If an account exists for that address, we've sent a link to reset your password. It expires in an hour."
        footer={<Link href="/login" className="font-medium text-forest hover:underline">Back to sign in</Link>}
      >
        <p className="text-sm text-body">
          Didn&apos;t get it? Check spam, or <Link href="/forgot-password" className="font-medium text-forest hover:underline">try again</Link>.
        </p>
      </AuthShell>
    );
  }
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send a reset link."
      footer={<Link href="/login" className="font-medium text-forest hover:underline">Back to sign in</Link>}
    >
      <form action={forgotPassword} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoFocus leadingIcon={<Mail />} />
        </div>
        <Button type="submit" className="w-full">Send reset link</Button>
      </form>
    </AuthShell>
  );
}
