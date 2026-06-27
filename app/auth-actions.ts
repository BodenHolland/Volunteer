"use server";

import { redirect } from "next/navigation";
import { destroyCurrentSession } from "@/lib/auth";
import { logEvent } from "@/lib/log";

/**
 * Sign out. This is a POST-only server action precisely so it can NEVER be
 * triggered by a GET — Next.js <Link> prefetch, browser predictive prefetch,
 * and link scanners all issue GETs, and a GET-based logout was silently
 * revoking sessions in the background (so the next click bounced to /login).
 *
 * All other authentication (sign-in, sign-up, password reset, email
 * verification) is owned by Firebase. The client signs in with Firebase and
 * exchanges the resulting ID token for a D1 session at POST /api/auth/session;
 * there is no self-hosted password flow here anymore.
 */
export async function signOut() {
  await destroyCurrentSession();
  logEvent("signout", {});
  redirect("/login");
}
