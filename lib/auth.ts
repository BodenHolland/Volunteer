import { cookies } from "next/headers";
import { getDb } from "./cf";
import { newId } from "./ids";
import type { User } from "./types";

export const SESSION_COOKIE = "tended_session";
const SESSION_TTL = 60 * 60 * 24 * 30 * 1000; // 30 days
const PBKDF2_ITERATIONS = 100_000;

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

const enc = new TextEncoder();
const toHex = (buf: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(buf as ArrayBuffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function sha256Hex(input: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(input)));
}

function randomHex(bytes: number): string {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

// ---- passwords (PBKDF2-SHA256) ----

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${toHex(bits)}`;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [scheme, iterStr, saltHex, hashHex] = stored.split("$");
  if (scheme !== "pbkdf2") return false;
  const iterations = Number(iterStr);
  const salt = new Uint8Array((saltHex.match(/../g) ?? []).map((h) => parseInt(h, 16)));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    hashHex.length * 4
  );
  return constantTimeEqual(toHex(bits), hashHex);
}

// ---- sessions (revocable, server-side; cookie holds an opaque token) ----

export async function createSession(userId: string, meta?: { userAgent?: string; ip?: string }): Promise<void> {
  const token = randomHex(32);
  const id = await sha256Hex(token);
  const now = Date.now();
  await getDb()
    .prepare("INSERT INTO sessions (id, user_id, created_at, expires_at, user_agent, ip) VALUES (?,?,?,?,?,?)")
    .bind(id, userId, now, now + SESSION_TTL, meta?.userAgent ?? null, meta?.ip ?? null)
    .run();
  const c = await cookies();
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL / 1000),
  });
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

// ---- one-time tokens (email verification, password reset) ----

const TOKEN_TTL = { email_verify: 60 * 60 * 24 * 1000, password_reset: 60 * 60 * 1000 };

export async function createToken(userId: string, kind: "email_verify" | "password_reset"): Promise<string> {
  const token = randomHex(32);
  const id = await sha256Hex(token);
  const now = Date.now();
  await getDb()
    .prepare("INSERT INTO auth_tokens (id, user_id, kind, created_at, expires_at) VALUES (?,?,?,?,?)")
    .bind(id, userId, kind, now, now + TOKEN_TTL[kind])
    .run();
  return token;
}

export async function consumeToken(token: string, kind: "email_verify" | "password_reset"): Promise<string | null> {
  const id = await sha256Hex(token);
  const db = getDb();
  const row = await db
    .prepare("SELECT user_id, expires_at, used_at FROM auth_tokens WHERE id = ? AND kind = ?")
    .bind(id, kind)
    .first<{ user_id: string; expires_at: number; used_at: number | null }>();
  if (!row || row.used_at || row.expires_at < Date.now()) return null;
  await db.prepare("UPDATE auth_tokens SET used_at = ? WHERE id = ?").bind(Date.now(), id).run();
  return row.user_id;
}

// ---- account lockout ----

export const MAX_FAILED_LOGINS = 8;
export const LOCKOUT_MS = 15 * 60 * 1000;

export function newUserId(): string {
  return newId("user");
}
