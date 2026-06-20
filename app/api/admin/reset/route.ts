import { NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { seedDatabase } from "@/lib/seed";

/**
 * Wipes and reseeds the database. Exposed for the demo so /admin/reset (and a
 * curl during dev) can restore a clean state. POST only.
 */
export async function POST() {
  try {
    await seedDatabase(getDb());
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
