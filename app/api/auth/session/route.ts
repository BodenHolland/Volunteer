import { NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { verifyFirebaseToken } from "@/lib/firebase-verify";
import { createSession, newUserId } from "@/lib/auth";
import { homeForUser } from "@/lib/session";
import { writeAudit } from "@/lib/audit";
import type { User } from "@/lib/types";

/**
 * Exchanges a verified Firebase ID token for one of our D1 sessions.
 * Links by firebase_uid, then by email (so seeded/demo accounts adopt their
 * Firebase identity on first sign-in), else creates a new recipient.
 */
export async function POST(req: Request) {
  let idToken: string | undefined;
  try {
    idToken = ((await req.json()) as { idToken?: string })?.idToken;
  } catch {
    /* fall through */
  }
  const identity = await verifyFirebaseToken(idToken);
  if (!identity) return NextResponse.json({ ok: false, error: "invalid token" }, { status: 401 });

  const db = getDb();
  const now = Date.now();
  let user =
    (await db.prepare("SELECT * FROM users WHERE firebase_uid = ? AND deleted_at IS NULL").bind(identity.uid).first<User>()) ?? null;

  if (!user && identity.email) {
    // Adopt an existing account with this email (e.g., a seeded demo user).
    const byEmail = await db.prepare("SELECT * FROM users WHERE email = ? AND deleted_at IS NULL").bind(identity.email).first<User>();
    if (byEmail) {
      await db
        .prepare("UPDATE users SET firebase_uid = ?, email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?")
        .bind(identity.uid, identity.emailVerified ? now : null, byEmail.id)
        .run();
      user = byEmail;
    }
  }

  if (!user) {
    const id = newUserId();
    await db
      .prepare(
        "INSERT INTO users (id, email, role, full_name, intent, firebase_uid, email_verified_at, created_at) VALUES (?,?,?,?,?,?,?,?)"
      )
      .bind(id, identity.email ?? `${identity.uid}@firebase.local`, "recipient", null, "n/a", identity.uid, identity.emailVerified ? now : null, now)
      .run();
    user = (await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<User>())!;
    await writeAudit({ actorUserId: id, action: "signup", entityType: "user", entityId: id, detail: { via: "firebase", email: identity.email } });
  }

  await createSession(user.id);
  await writeAudit({ actorUserId: user.id, action: "login", entityType: "user", entityId: user.id, detail: { via: "firebase" } });

  // New recipients with no profile yet go to onboarding; others to their home.
  const needsOnboarding = user.role === "recipient" && !user.full_name;
  return NextResponse.json({ ok: true, next: needsOnboarding ? "/start?step=location" : homeForUser(user) });
}
