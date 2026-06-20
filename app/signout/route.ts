import { NextResponse } from "next/server";
import { destroyCurrentSession } from "@/lib/auth";

/** Revokes the current session and returns to sign-in. */
export async function GET(req: Request) {
  await destroyCurrentSession();
  return NextResponse.redirect(new URL("/login", req.url));
}
