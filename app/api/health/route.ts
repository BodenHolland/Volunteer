import { NextResponse } from "next/server";
import { getDb, getEnv, getFiles } from "@/lib/cf";
import { getAiBacklog } from "@/lib/observability";

/**
 * Machine-readable health check for uptime monitors. Verifies the D1 and R2
 * bindings actually respond, surfaces the AI-review backlog, and reports which
 * critical secrets are configured (M10) — booleans only, never the values.
 *
 * `ok` (the 200/503 gate) tracks only the hard liveness signals (D1 + R2). The
 * AI backlog and secret presence are diagnostics: a high backlog or a missing
 * optional secret is worth alerting on, but the service is still "up".
 */
export async function GET() {
  const started = Date.now();

  let db = false;
  try {
    await getDb().prepare("SELECT 1 AS ok").first();
    db = true;
  } catch {
    db = false;
  }

  let r2 = false;
  try {
    // A HEAD on a (possibly absent) key still proves the binding responds.
    await getFiles().head("__healthcheck__");
    r2 = true;
  } catch {
    r2 = false;
  }

  // AI-review backlog: submissions stuck in 'ai_reviewing'. A growing number
  // means the validator queue is wedged. Best-effort — depends on D1 being up.
  let aiBacklog: number | null = null;
  if (db) {
    try {
      aiBacklog = await getAiBacklog();
    } catch {
      aiBacklog = null;
    }
  }

  // Secret presence (booleans only — never echo a secret value). Lets an
  // operator catch a deploy that forgot to set a required secret.
  let secrets: Record<string, boolean> = {};
  try {
    const env = getEnv() as unknown as Record<string, unknown>;
    const present = (k: string) => typeof env[k] === "string" && (env[k] as string).length > 0;
    secrets = {
      pii_encryption_key: present("PII_ENCRYPTION_KEY"),
      openrouter_api_key: present("OPENROUTER_API_KEY"),
      cron_secret: present("CRON_SECRET"),
      open_prices_token: present("OPEN_PRICES_TOKEN"),
    };
  } catch {
    secrets = {};
  }

  const ok = db && r2;
  return NextResponse.json(
    { ok, db, r2, ai_backlog: aiBacklog, secrets, latency_ms: Date.now() - started },
    { status: ok ? 200 : 503 }
  );
}
