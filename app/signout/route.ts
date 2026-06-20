import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/** Clears the soft session (identity) and returns to /start. */
export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/start", req.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
