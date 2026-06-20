import { NextResponse } from "next/server";

/** Sets the UI locale cookie and returns to `next`. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const to = url.searchParams.get("to") === "es" ? "es" : "en";
  const next = url.searchParams.get("next") || "/";
  const res = NextResponse.redirect(new URL(next.startsWith("/") ? next : "/", req.url));
  res.cookies.set("locale", to, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
}
