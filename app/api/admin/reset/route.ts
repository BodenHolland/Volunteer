import { NextResponse } from "next/server";
import { getDb, isDemoMode } from "@/lib/cf";
import { seedDatabase } from "@/lib/seed";
import { getCurrentUser } from "@/lib/session";

/**
 * Wipes and reseeds the sample dataset. Available only in DEMO_MODE; in production
 * this route does not exist. Within DEMO_MODE it still requires an admin unless the
 * database is empty (first-run bootstrap).
 */
export async function POST() {
  try {
    if (!isDemoMode()) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    const db = getDb();
    const count = await db.prepare("SELECT COUNT(*) AS n FROM users").first<{ n: number }>();
    const empty = !count || count.n === 0;
    if (!empty) {
      const user = await getCurrentUser();
      if (!user || user.role !== "admin") {
        return NextResponse.json({ ok: false, error: "admin required" }, { status: 403 });
      }
    }
    await seedDatabase(db);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
