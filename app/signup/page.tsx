import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { getDict } from "@/lib/i18n";
import { FirebaseAuthForm } from "@/components/firebase-auth-form";

export const metadata = { title: "Create account — Tended" };

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const { t } = await getDict();
  const a = t.auth;
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
      <FirebaseAuthForm mode="signup" />
      <p className="mt-4 text-center text-xs text-meta">{a.legalNote}</p>
    </AuthShell>
  );
}
