"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { getDb } from "@/lib/cf";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroyCurrentSession,
  destroyAllUserSessions,
  createToken,
  consumeToken,
  newUserId,
  MAX_FAILED_LOGINS,
  LOCKOUT_MS,
} from "@/lib/auth";
import { homeForUser } from "@/lib/session";
import { sendEmail, verifyEmailMessage, resetPasswordMessage, appOrigin } from "@/lib/notify";
import { writeAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/ratelimit";
import { logEvent } from "@/lib/log";
import type { Role, User } from "@/lib/types";

const emailSchema = z.string().trim().toLowerCase().email();
const passwordSchema = z.string().min(10, "Use at least 10 characters.");

// Rate-limit windows (fixed window). Deliberately generous so normal flows
// work but abusive hammering is throttled.
const RL = {
  loginIp: { limit: 20, windowMs: 5 * 60 * 1000 },
  loginEmail: { limit: 8, windowMs: 5 * 60 * 1000 },
  signupIp: { limit: 10, windowMs: 10 * 60 * 1000 },
  forgotIp: { limit: 10, windowMs: 10 * 60 * 1000 },
  resetIp: { limit: 10, windowMs: 10 * 60 * 1000 },
};

/**
 * Best-effort client IP from Cloudflare's `cf-connecting-ip` (falls back to
 * x-forwarded-for, then a constant). Used only for rate-limit keying.
 */
async function clientIp(): Promise<string> {
  try {
    const h = await headers();
    return (
      h.get("cf-connecting-ip") ||
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

export async function login(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  if (!parsed.success || !password) redirect("/login?error=1");
  const email = parsed.data;

  // Rate limit by IP and by email. On exceed, reuse the existing "locked"
  // message (rate ≈ too many attempts) so we don't touch the login page.
  const ip = await clientIp();
  const ipRl = await rateLimit(`login:ip:${ip}`, RL.loginIp.limit, RL.loginIp.windowMs);
  const emailRl = await rateLimit(`login:email:${email}`, RL.loginEmail.limit, RL.loginEmail.windowMs);
  if (!ipRl.ok || !emailRl.ok) {
    logEvent("login_rate_limited", { email, ip, by: !ipRl.ok ? "ip" : "email" });
    redirect("/login?error=locked");
  }

  const db = getDb();
  const user = await db.prepare("SELECT * FROM users WHERE email = ? AND deleted_at IS NULL").bind(email).first<User>();
  // Uniform failure (don't leak which accounts exist).
  if (!user) {
    logEvent("login_failed", { email, ip, reason: "no_user" });
    await writeAudit({ action: "login_failed", entityType: "user", detail: { email, ip, reason: "no_user" } });
    redirect("/login?error=1");
  }

  if (user.locked_until && user.locked_until > Date.now()) {
    logEvent("login_failed", { email, ip, userId: user.id, reason: "locked" });
    await writeAudit({ actorUserId: user.id, action: "login_failed", entityType: "user", entityId: user.id, detail: { email, ip, reason: "locked" } });
    redirect("/login?error=locked");
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    const count = (user.failed_login_count ?? 0) + 1;
    const lock = count >= MAX_FAILED_LOGINS ? Date.now() + LOCKOUT_MS : null;
    await db.prepare("UPDATE users SET failed_login_count = ?, locked_until = ? WHERE id = ?").bind(count, lock, user.id).run();
    logEvent("login_failed", { email, ip, userId: user.id, reason: "bad_password", failedCount: count, locked: Boolean(lock) });
    await writeAudit({ actorUserId: user.id, action: "login_failed", entityType: "user", entityId: user.id, detail: { email, ip, reason: "bad_password", failedCount: count, locked: Boolean(lock) } });
    redirect(lock ? "/login?error=locked" : "/login?error=1");
  }

  await db.prepare("UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = ?").bind(user.id).run();
  await createSession(user.id);
  logEvent("login", { email, ip, userId: user.id });
  await writeAudit({ actorUserId: user.id, action: "login", entityType: "user", entityId: user.id, detail: { email, ip } });
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : homeForUser(user));
}

export async function signup(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const emailParsed = emailSchema.safeParse(formData.get("email"));
  const passwordParsed = passwordSchema.safeParse(formData.get("password"));
  // Role + intent are picked on the next step (/get-started). Default to a
  // blank-slate recipient so the wizard can branch from there.
  const role: Role = "recipient";
  const intent = "n/a";

  if (!fullName) redirect("/signup?error=name");
  if (!emailParsed.success) redirect("/signup?error=email");
  if (!passwordParsed.success) redirect("/signup?error=password");
  const email = emailParsed.data;

  const ip = await clientIp();
  const rl = await rateLimit(`signup:ip:${ip}`, RL.signupIp.limit, RL.signupIp.windowMs);
  if (!rl.ok) {
    logEvent("signup_rate_limited", { email, ip });
    redirect("/signup?error=email");
  }

  const db = getDb();
  const existing = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) redirect("/signup?error=taken");

  const id = newUserId();
  const passwordHash = await hashPassword(passwordParsed.data);
  await db
    .prepare("INSERT INTO users (id, email, role, full_name, intent, password_hash, created_at) VALUES (?,?,?,?,?,?,?)")
    .bind(id, email, role, fullName, intent, passwordHash, Date.now())
    .run();

  // Email verification (flow real; delivery stubbed).
  const token = await createToken(id, "email_verify");
  const link = `${await appOrigin()}/verify-email?token=${token}`;
  await sendEmail(verifyEmailMessage(email, link));

  // Accept a pending org invitation addressed to this email, if any.
  const invite = await db
    .prepare("SELECT id, org_id, org_role FROM org_invites WHERE email = ? AND accepted_at IS NULL ORDER BY created_at DESC LIMIT 1")
    .bind(email)
    .first<{ id: string; org_id: string; org_role: string }>();
  if (invite) {
    await db
      .prepare("UPDATE users SET role = 'org_member', org_id = ?, org_role = ? WHERE id = ?")
      .bind(invite.org_id, invite.org_role, id)
      .run();
    await db.prepare("UPDATE org_invites SET accepted_at = ? WHERE id = ?").bind(Date.now(), invite.id).run();
  }

  await createSession(id);
  logEvent("signup", { email, ip, userId: id, role: invite ? "org_member" : role });
  await writeAudit({ actorUserId: id, action: "signup", entityType: "user", entityId: id, detail: { email, ip, role, invited: Boolean(invite) } });
  if (invite) redirect("/org");
  redirect("/get-started");
}

export async function forgotPassword(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));
  const ip = await clientIp();
  // Throttle reset requests per IP (anti-enumeration / anti-spam). Always end on
  // the same response regardless of outcome.
  const rl = await rateLimit(`forgot:ip:${ip}`, RL.forgotIp.limit, RL.forgotIp.windowMs);
  if (rl.ok && parsed.success) {
    const db = getDb();
    const user = await db.prepare("SELECT id, email FROM users WHERE email = ?").bind(parsed.data).first<{ id: string; email: string }>();
    if (user) {
      const token = await createToken(user.id, "password_reset");
      const link = `${await appOrigin()}/reset-password?token=${token}`;
      await sendEmail(resetPasswordMessage(user.email, link));
      logEvent("password_reset_requested", { email: user.email, ip, userId: user.id });
    }
  } else if (!rl.ok) {
    logEvent("forgot_password_rate_limited", { ip });
  }
  // Always the same response, never reveal whether an account exists.
  redirect("/forgot-password?sent=1");
}

export async function resetPassword(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const passwordParsed = passwordSchema.safeParse(formData.get("password"));
  if (!token) redirect("/login");
  if (!passwordParsed.success) redirect(`/reset-password?token=${encodeURIComponent(token)}&error=password`);

  const ip = await clientIp();
  const rl = await rateLimit(`reset:ip:${ip}`, RL.resetIp.limit, RL.resetIp.windowMs);
  if (!rl.ok) {
    logEvent("reset_password_rate_limited", { ip });
    redirect("/reset-password?error=invalid");
  }

  const userId = await consumeToken(token, "password_reset");
  if (!userId) redirect("/reset-password?error=invalid");

  const db = getDb();
  await db.prepare("UPDATE users SET password_hash = ?, failed_login_count = 0, locked_until = NULL WHERE id = ?")
    .bind(await hashPassword(passwordParsed.data), userId)
    .run();
  // Invalidate all existing sessions on password change.
  await destroyAllUserSessions(userId);
  logEvent("password_reset", { ip, userId });
  await writeAudit({ actorUserId: userId, action: "password_reset", entityType: "user", entityId: userId, detail: { ip } });
  redirect("/login?reset=1");
}

/**
 * Sign out. This is a POST-only server action precisely so it can NEVER be
 * triggered by a GET, Next.js <Link> prefetch, browser predictive prefetch,
 * and link scanners all issue GETs, and a GET-based logout was silently
 * revoking sessions in the background (so the next click bounced to /login).
 */
export async function signOut() {
  await destroyCurrentSession();
  logEvent("signout", {});
  redirect("/login");
}
