import { NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { consumeToken } from "@/lib/auth";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/login", req.url));
  const userId = await consumeToken(token, "email_verify");
  if (userId) {
    await getDb().prepare("UPDATE users SET email_verified_at = ? WHERE id = ?").bind(Date.now(), userId).run();
    return NextResponse.redirect(new URL("/login?verified=1", req.url));
  }
  return NextResponse.redirect(new URL("/login?error=verify", req.url));
}
