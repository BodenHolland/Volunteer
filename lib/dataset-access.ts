import "server-only";

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

/**
 * Dataset exports are available to every signed-in Tended user, but never to
 * anonymous requests. Route handlers use this in addition to middleware so a
 * direct request to an /api/data URL cannot bypass the access check.
 */
export async function requireDatasetAccess(request: Request): Promise<Response | null> {
  if (await getCurrentUser()) return null;

  const url = new URL("/login", request.url);
  const requested = new URL(request.url);
  url.searchParams.set("next", `${requested.pathname}${requested.search}`);
  return NextResponse.redirect(url);
}
