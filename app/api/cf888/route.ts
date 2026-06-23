/**
 * Legacy CA-specific path. The endpoint is now state-agnostic and lives at
 * /api/work-cert. This thin redirect preserves any external links (the
 * dashboard button has been updated to call /api/work-cert directly).
 */
import { NextResponse } from "next/server";

export function GET(req: Request) {
  const url = new URL(req.url);
  const target = new URL("/api/work-cert", url);
  url.searchParams.forEach((v, k) => target.searchParams.set(k, v));
  return NextResponse.redirect(target, 308);
}
