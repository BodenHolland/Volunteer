import { NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { seedDatabase } from "@/lib/seed";
import { getCurrentUser } from "@/lib/session";

/**
 * Wipes and reseeds the demo dataset. Allowed only for an admin — except when the
 * database is empty (first-run bootstrap), so a fresh deploy can be seeded once.
 */
export async function POST() {
  try {
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
