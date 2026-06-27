import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { getDb, isDemoMode } from "@/lib/cf";
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
  if (isDemoMode()) await ensureSeeded(getDb());
  const { t } = await getDict();
  const a = t.auth;
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
      {sp.error === "verify" && (
        <p className="mb-4 rounded-md bg-clay-subtle px-3 py-2 text-sm text-clay">
          Please verify your email — check the link we sent you, then sign in again. You can resend it below.
        </p>
      )}
      {sp.reset && <p className="mb-4 rounded-md bg-forest-subtle px-3 py-2 text-sm text-forest">Your password was reset. Sign in with your new password.</p>}
      {sp.verified && <p className="mb-4 rounded-md bg-forest-subtle px-3 py-2 text-sm text-forest">Your email is verified.</p>}
      <FirebaseAuthForm mode="login" next={sp.next} />
    </AuthShell>
  );
}
