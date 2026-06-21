import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

// App surfaces that require an authenticated session.
const SESSION_REQUIRED = ["/app", "/org", "/admin"];
// Public pages that live under a session-gated prefix.
const SESSION_EXEMPT = ["/org/signup"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const exempt = SESSION_EXEMPT.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const needsSession = !exempt && SESSION_REQUIRED.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (needsSession && !req.cookies.get(SESSION_COOKIE)) {
    // Diagnostic: log every auth bounce with enough detail to debug mobile
    // Safari cookie-drop. Visible in `wrangler tail` and queryable later via
    // /api/admin/errors/recent?where=auth_bounce.
    const ua = req.headers.get("user-agent") ?? "";
    const referer = req.headers.get("referer") ?? "";
    const cookieHeader = req.headers.get("cookie") ?? "";
    const cookieNames = cookieHeader
      .split(";")
      .map((c) => c.split("=")[0].trim())
      .filter(Boolean);
    console.log(
      `[auth_bounce] path=${pathname} ua_short=${ua.slice(0, 80)} ` +
        `referer=${referer.slice(0, 120)} cookies_present=${JSON.stringify(cookieNames)}`
    );
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
