import { redirect } from "next/navigation";
import { getSessionUser } from "./auth";
import { isDemoMode } from "./cf";
import type { User } from "./types";

/** Current authenticated user (real session), or null. */
export async function getCurrentUser(): Promise<User | null> {
  return getSessionUser();
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Production gate: app access requires a verified email. The verify-email flow
  // (password users) and the Firebase session route (verified-email claim) both
  // set email_verified_at, so properly-provisioned users are unaffected. Skipped
  // in DEMO_MODE so seeded sample accounts still work without a verification step.
  if (!isDemoMode() && !user.email_verified_at) redirect("/login?error=verify");
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

/**
 * True when the signed-in viewer has selected California. The CF 888 is
 * California's CalFresh form, so references to it only make sense for CA
 * recipients — anonymous or other-state viewers get state-neutral wording.
 */
export async function viewerInCalifornia(): Promise<boolean> {
  const user = await getCurrentUser();
  return (user?.state ?? "").trim().toUpperCase() === "CA";
}

/** Landing destination for a user based on role. */
export function homeForUser(user: User): string {
  if (user.role === "org_member") return "/org";
  if (user.role === "admin") return "/admin";
  return "/app";
}
