import { NextResponse } from "next/server";
import { LOCALE_META } from "@/lib/i18n/registry";

/** Sets the UI locale cookie and returns to `next`. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const requested = url.searchParams.get("to") ?? "en";
  const to = requested in LOCALE_META ? requested : "en";
  const next = url.searchParams.get("next") || "/";
  const res = NextResponse.redirect(new URL(next.startsWith("/") ? next : "/", req.url));
  res.cookies.set("locale", to, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
}
