import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./cf";
import type { User } from "./types";

export const DEMO_AUTH_COOKIE = "cf_demo_auth";
export const SESSION_COOKIE = "cf_session";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

export async function getCurrentUser(): Promise<User | null> {
  const c = await cookies();
  const id = c.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const user = await getDb().prepare("SELECT * FROM users WHERE id = ?").bind(id).first<User>();
  return user ?? null;
}

/** Redirects to /start if no soft session. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/start");
  return user;
}

export async function requireRecipient(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "recipient") redirect("/unauthorized");
  return user;
}

export async function requireOrgMember(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "org_member") redirect("/unauthorized");
  return user;
}

export async function requireOrgAdmin(): Promise<User> {
  const user = await requireOrgMember();
  if (user.org_role !== "org_admin") redirect("/unauthorized");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/unauthorized");
  return user;
}

export async function setSession(userId: string): Promise<void> {
  const c = await cookies();
  c.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd(),
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

export async function clearSession(): Promise<void> {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
}

export async function setDemoAuth(): Promise<void> {
  const c = await cookies();
  c.set(DEMO_AUTH_COOKIE, "ok", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd(),
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

/** Landing destination for a user based on role. */
export function homeForUser(user: User): string {
  if (user.role === "org_member") return "/org";
  if (user.role === "admin") return "/admin";
  return "/app";
}
