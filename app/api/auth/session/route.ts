import { NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { verifyFirebaseToken } from "@/lib/firebase-verify";
import {
  createSessionToken,
  newUserId,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth";
import { homeForUser } from "@/lib/session";
import { writeAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/ratelimit";
import type { User } from "@/lib/types";

/**
 * Exchanges a verified Firebase ID token for one of our D1 sessions.
 * Links by firebase_uid, then by email (so seeded accounts adopt their
 * Firebase identity on first sign-in), else creates a new recipient.
 */
export async function POST(req: Request) {
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = await rateLimit(`firebase-session:${ip}`, 30, 5 * 60 * 1000);
  if (!limit.ok) return NextResponse.json({ ok: false, error: "Too many attempts" }, { status: 429 });

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
    // Adopt an existing active account with this email (e.g., a seeded account).
    const byEmail = await db.prepare("SELECT * FROM users WHERE email = ? AND deleted_at IS NULL").bind(identity.email).first<User>();
    if (byEmail) {
      await db
        .prepare("UPDATE users SET firebase_uid = ?, email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?")
        .bind(identity.uid, identity.emailVerified ? now : null, byEmail.id)
        .run();
      user = byEmail;
    }
  }

  if (!user && identity.email) {
    // Re-signup after soft-delete: reactivate the deleted row rather than
    // hitting the UNIQUE constraint on email with a fresh INSERT.
    const deleted = await db.prepare("SELECT * FROM users WHERE email = ? AND deleted_at IS NOT NULL").bind(identity.email).first<User>();
    if (deleted) {
      await db
        .prepare(
          "UPDATE users SET deleted_at = NULL, firebase_uid = ?, email_verified_at = ?, role = 'recipient', intent = 'n/a', full_name = NULL WHERE id = ?"
        )
        .bind(identity.uid, identity.emailVerified ? now : null, deleted.id)
        .run();
      user = (await db.prepare("SELECT * FROM users WHERE id = ?").bind(deleted.id).first<User>())!;
      await writeAudit({ actorUserId: deleted.id, action: "signup", entityType: "user", entityId: deleted.id, detail: { via: "firebase", email: identity.email, reactivated: true } });
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

  const token = await createSessionToken(user.id);
  await writeAudit({ actorUserId: user.id, action: "login", entityType: "user", entityId: user.id, detail: { via: "firebase" } });

  // New recipients with no profile yet go to onboarding; others to their home.
  // Mirrors the isOnboarded check in /start/page.tsx: city + state + intent set.
  const needsOnboarding = user.role === "recipient" && (!user.city || !user.state || !user.intent || user.intent === "n/a");
  const response = NextResponse.json({
    ok: true,
    next: needsOnboarding ? "/start?step=location" : homeForUser(user),
  });
  // Set the cookie directly on this response — relying on cookies().set() from
  // next/headers to attach to a fetch-style NextResponse has been unreliable
  // (mobile Safari occasionally drops the Set-Cookie, producing an auth loop).
  response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return response;
}
