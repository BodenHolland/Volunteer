import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/cf";
import { getCurrentUser } from "@/lib/session";
import { processSubmissionAi } from "@/lib/process";
import { rateLimit } from "@/lib/ratelimit";
import type { Submission } from "@/lib/types";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "no session" }, { status: 401 });

  const limit = await rateLimit(`submission-status:${user.id}`, 30, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const db = getDb();
  const sub = await db.prepare("SELECT * FROM submissions WHERE id = ?").bind(id).first<Submission>();
  // This polling route is only used by the submitting recipient. Return the
  // same response for an unknown and unauthorized id so it cannot be used to
  // probe other volunteers' review state or fraud flags.
  if (!sub || sub.user_id !== user.id) return NextResponse.json({ error: "not found" }, { status: 404 });

  // The poll PRIMARILY reads status. To preserve liveness if the submit-time
  // waitUntil job was evicted, kick the pipeline at most once in the background
  // (never synchronously in the response path) when the row still looks stuck.
  // processSubmissionAi self-guards with an atomic lease, so a concurrent
  // waitUntil run and this kick cannot both proceed.
  if (sub.status === "ai_reviewing") {
    try {
      getCloudflareContext().ctx.waitUntil(processSubmissionAi(id));
    } catch {
      /* outside Workers runtime — pipeline runs lazily on the next poll */
    }
  }

  // While leased, ai_verdict_json briefly holds a sentinel; only surface a
  // verdict once the row has left ai_reviewing (i.e. processing finished).
  const verdict =
    sub.status !== "ai_reviewing" && sub.ai_verdict_json ? JSON.parse(sub.ai_verdict_json) : null;

  const flags =
    (await db.prepare("SELECT kind, severity FROM submission_flags WHERE submission_id = ?").bind(id).all()).results ?? [];

  return NextResponse.json({
    status: sub.status,
    verdict,
    flags,
  });
}
