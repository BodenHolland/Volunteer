import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Lock } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getEnv, getDb } from "@/lib/cf";
import { setDemoAuth } from "@/lib/session";
import { ensureSeeded } from "@/lib/seed";
import { prewarmOpenRouter } from "@/lib/ai";

export const metadata = { title: "Enter — Tended" };

async function enterAction(formData: FormData) {
  "use server";
  const env = getEnv();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (password !== env.SITE_PASSWORD) {
    redirect(`/enter?error=1${next !== "/" ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  await setDemoAuth();
  await ensureSeeded(getDb());

  // Pre-warm OpenRouter so the first real validation is fast (fire-and-forget).
  try {
    getCloudflareContext().ctx.waitUntil(prewarmOpenRouter(env.OPENROUTER_API_KEY, env.OPENROUTER_MODEL));
  } catch {
    void prewarmOpenRouter(env.OPENROUTER_API_KEY, env.OPENROUTER_MODEL);
  }

  redirect(next.startsWith("/") ? next : "/");
}

export default async function EnterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-section px-4">
      <div className="w-full max-w-[400px] rounded-lg border border-line bg-white p-8 shadow-sm">
        <Logo size={24} className="text-xl" />
        <h1 className="mt-6 text-2xl font-semibold text-ink">Pilot access</h1>
        <p className="mt-2 text-sm text-body">
          This is an unlisted pilot demo. Enter the access password to continue.
        </p>

        <form action={enterAction} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={sp.next ?? "/"} />
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              leadingIcon={<Lock />}
              placeholder="Access password"
              aria-describedby={sp.error ? "pw-error" : undefined}
            />
            {sp.error && (
              <p id="pw-error" className="text-sm text-brick" role="alert">
                That password didn&apos;t match. Try again.
              </p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Enter
          </Button>
        </form>

        <p className="mt-6 text-xs text-meta">
          No real accounts, recipients, or state submissions. Demo data only.
        </p>
      </div>
    </main>
  );
}
