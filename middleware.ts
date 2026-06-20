import { NextRequest, NextResponse } from "next/server";

// Paths that require a soft session (an identity).
const SESSION_REQUIRED = ["/app", "/org", "/admin"];

// Public pages that live under a session-gated prefix.
const SESSION_EXEMPT = ["/org/signup"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The site password gate is disabled — the demo is open. (The /enter route and
  // SITE_PASSWORD remain in the codebase so the gate can be re-enabled easily.)

  // Soft session for app surfaces: route to the identity picker when absent.
  const exempt = SESSION_EXEMPT.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const needsSession = !exempt && SESSION_REQUIRED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (needsSession && !req.cookies.get("cf_session")) {
    return NextResponse.redirect(new URL("/start", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
