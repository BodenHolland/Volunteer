import { NextResponse } from "next/server";
import { getDb, getFiles } from "@/lib/cf";

/**
 * Machine-readable health check for uptime monitors. Verifies the D1 and R2
 * bindings actually respond. Returns 200 only when both are reachable.
 */
export async function GET() {
  const started = Date.now();
  let db = false;
  let r2 = false;
  try {
    await getDb().prepare("SELECT 1 AS ok").first();
    db = true;
  } catch {
    db = false;
  }
  try {
    // A HEAD on a (possibly absent) key still proves the binding responds.
    await getFiles().head("__healthcheck__");
    r2 = true;
  } catch {
    r2 = false;
  }
  const ok = db && r2;
  return NextResponse.json(
    { ok, db, r2, latency_ms: Date.now() - started },
    { status: ok ? 200 : 503 }
  );
}
