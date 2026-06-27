import { NextResponse } from "next/server";
import { getDb, getFiles, getEnv } from "@/lib/cf";
import { getAiBacklog, getOpenPricesBacklog } from "@/lib/observability";

/**
 * Machine-readable health check for uptime monitors. Verifies the D1 and R2
 * bindings actually respond, and surfaces a few cheap, non-gating health
 * signals (queue backlogs, optional-integration config) so a monitor can
 * alert on degradation, not just hard outage.
 *
 * Liveness gate: returns 200 only when both D1 and R2 are reachable; the
 * backlog/config fields are best-effort and never flip the status code.
 * All checks run concurrently to stay fast.
 */
export async function GET() {
  const started = Date.now();

  // Probe D1 and R2 reachability — these gate the status code.
  const dbProbe = getDb()
    .prepare("SELECT 1 AS ok")
    .first()
    .then(() => true)
    .catch(() => false);

  // A HEAD on a (possibly absent) key still proves the binding responds.
  const r2Probe = getFiles()
    .head("__healthcheck__")
    .then(() => true)
    .catch(() => false);

  // Best-effort backlog signals. A failure here must not fail the check, so
  // they resolve to null rather than rejecting.
  const aiProbe = getAiBacklog().catch(() => null);
  const opProbe = getOpenPricesBacklog().catch(() => null);

  const [db, r2, aiBacklog, openPricesBacklog] = await Promise.all([
    dbProbe,
    r2Probe,
    aiProbe,
    opProbe,
  ]);

  // Cheap config-presence signal — does not touch the network or leak secrets.
  let aiConfigured = false;
  let piiKeyConfigured = false;
  try {
    const env = getEnv();
    aiConfigured = Boolean(env.OPENROUTER_API_KEY);
    piiKeyConfigured = Boolean(env.PII_ENCRYPTION_KEY);
  } catch {
    // env unavailable (e.g. outside request context) — leave both false.
  }

  const ok = db && r2;
  return NextResponse.json(
    {
      ok,
      db,
      r2,
      backlog: {
        ai_reviewing: aiBacklog,
        open_prices_queue: openPricesBacklog,
      },
      config: {
        ai_configured: aiConfigured,
        pii_key_configured: piiKeyConfigured,
      },
      latency_ms: Date.now() - started,
    },
    { status: ok ? 200 : 503 }
  );
}
