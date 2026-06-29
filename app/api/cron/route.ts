import { NextResponse, type NextRequest } from "next/server";
import { getEnv } from "@/lib/cf";
import { sha256Hex } from "@/lib/auth";
import { retryOpenPricesQueue } from "@/lib/audit-pipeline";
import { runSweep } from "@/lib/sweep";

/**
 * Scheduled-maintenance entrypoint (H9).
 *
 * @opennextjs/cloudflare's generated worker default-exports `fetch` only — it
 * does NOT emit a `scheduled()` handler — so `triggers.crons` in wrangler.jsonc
 * cannot fire jobs directly. The pattern is a tiny standalone cron Worker (or
 * any external scheduler) that, on each trigger, makes an authenticated request
 * to THIS route. See wrangler.jsonc and README "Scheduled jobs / cron".
 *
 * Auth: a shared CRON_SECRET (set via `wrangler secret put CRON_SECRET`), passed
 * as either `Authorization: Bearer <secret>` or `?key=<secret>`. Compared in
 * constant time over SHA-256 digests so neither length nor content leaks via
 * timing. With no secret configured the route is closed (503) — it never runs
 * unauthenticated.
 *
 * Jobs:
 *   1. Drain the Open Prices retry queue (lib/audit-pipeline.retryOpenPricesQueue).
 *   2. Run the retention/expiry sweep (lib/sweep.runSweep) for real.
 */

async function timingSafeMatch(provided: string, expected: string): Promise<boolean> {
  // Hash both sides to fixed-length hex, then compare char-by-char without an
  // early return, so a mismatch reveals nothing about length or position.
  const [a, b] = await Promise.all([sha256Hex(provided), sha256Hex(expected)]);
  let diff = a.length ^ b.length;
  for (let i = 0; i < a.length && i < b.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function extractSecret(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice("Bearer ".length).trim();
  const key = new URL(req.url).searchParams.get("key");
  return key ? key.trim() : null;
}

async function handle(req: NextRequest): Promise<NextResponse> {
  const expected = (getEnv() as unknown as { CRON_SECRET?: string }).CRON_SECRET;
  if (!expected) {
    // Fail closed: an unconfigured secret means the endpoint is not enabled.
    return NextResponse.json({ ok: false, error: "cron not configured" }, { status: 503 });
  }
  const provided = extractSecret(req);
  if (!provided || !(await timingSafeMatch(provided, expected))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  // Independent jobs; a failure in one must not abort the other.
  const [openPrices, sweep] = await Promise.allSettled([
    retryOpenPricesQueue(100),
    runSweep({ dryRun: false }),
  ]);

  return NextResponse.json({
    ok: true,
    ran_at: started,
    duration_ms: Date.now() - started,
    open_prices:
      openPrices.status === "fulfilled"
        ? openPrices.value
        : { error: String(openPrices.reason).slice(0, 300) },
    sweep:
      sweep.status === "fulfilled"
        ? sweep.value
        : { error: String(sweep.reason).slice(0, 300) },
  });
}

// Cron Workers issue GET by default; POST is accepted for manual/operator runs.
export const GET = handle;
export const POST = handle;
