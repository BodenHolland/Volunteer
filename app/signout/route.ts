import { NextResponse } from "next/server";
import { destroyCurrentSession } from "@/lib/auth";

/**
 * GET is intentionally INERT, it must never revoke a session. Next.js <Link>
 * prefetch, browser predictive prefetch, and link scanners all issue GETs, and
 * a destructive GET here was silently logging people out (then bouncing the
 * next click to /login). Sign-out happens via the POST-only `signOut` server
 * action (see app/auth-actions.ts) or the POST handler below.
 */
export async function GET(req: Request) {
  return NextResponse.redirect(new URL("/login", req.url));
}

/** Destructive sign-out for a no-JS form fallback (POST is not prefetched). */
export async function POST(req: Request) {
  await destroyCurrentSession();
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}
