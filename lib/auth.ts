import { cookies } from "next/headers";
import { getDb } from "./cf";
import { newId } from "./ids";
import type { User } from "./types";

export const SESSION_COOKIE = "tended_session";
const SESSION_TTL = 60 * 60 * 24 * 30 * 1000; // 30 days

const enc = new TextEncoder();
const toHex = (buf: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(buf as ArrayBuffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function sha256Hex(input: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(input)));
}

function randomHex(bytes: number): string {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

// Authentication is handled by Firebase (email/password + Google). The client
// signs in with Firebase, then POSTs the ID token to /api/auth/session, which
// verifies it and mints one of the revocable D1 sessions below. There is no
// self-hosted password store anymore; the session machinery is the only thing
// this app owns.

// ---- sessions (revocable, server-side; cookie holds an opaque token) ----

// Secure cookies are only sent back over HTTPS. Prod and the workers.dev preview
// are HTTPS, but local `next dev` is plain http://localhost (and LAN IPs on a
// phone), where a Secure cookie is silently dropped by the browser — which made
// sign-in "not stick" (middleware saw no cookie and bounced back to /login on the
// very next request). Gate Secure on a real HTTPS deployment instead of hardcoding.
const IS_SECURE_ENV = process.env.NODE_ENV === "production";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_SECURE_ENV,
  sameSite: "lax" as const,
  path: "/",
  maxAge: Math.floor(SESSION_TTL / 1000),
};

/**
 * Mint a session row and return the token. Caller is responsible for setting
 * the cookie on whatever response it's returning. Use this from Route Handlers
 * that build their own NextResponse — relying on cookies().set() from
 * next/headers to attach to a separately-constructed response is unreliable.
 */
export async function createSessionToken(userId: string, meta?: { userAgent?: string; ip?: string }): Promise<string> {
  const token = randomHex(32);
  const id = await sha256Hex(token);
  const now = Date.now();
  await getDb()
    .prepare("INSERT INTO sessions (id, user_id, created_at, expires_at, user_agent, ip) VALUES (?,?,?,?,?,?)")
    .bind(id, userId, now, now + SESSION_TTL, meta?.userAgent ?? null, meta?.ip ?? null)
    .run();
  return token;
}

export async function createSession(userId: string, meta?: { userAgent?: string; ip?: string }): Promise<void> {
  const token = await createSessionToken(userId, meta);
  const c = await cookies();
  c.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
}

export async function getSessionUser(): Promise<User | null> {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const id = await sha256Hex(token);
  const row = await getDb()
    .prepare(
      "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ? AND u.deleted_at IS NULL"
    )
    .bind(id, Date.now())
    .first<User>();
  return row ?? null;
}

export async function destroyCurrentSession(): Promise<void> {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (token) {
    const id = await sha256Hex(token);
    await getDb().prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
  }
  c.delete(SESSION_COOKIE);
}

export async function destroyAllUserSessions(userId: string): Promise<void> {
  await getDb().prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
}

export function newUserId(): string {
  return newId("user");
}
