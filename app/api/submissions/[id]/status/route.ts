import { NextResponse } from "next/server";
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
  let sub = await db.prepare("SELECT * FROM submissions WHERE id = ?").bind(id).first<Submission>();
  // This polling route is only used by the submitting recipient. Return the
  // same response for an unknown and unauthorized id so it cannot be used to
  // probe other volunteers' review state or fraud flags.
  if (!sub || sub.user_id !== user.id) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Fallback: if the background job didn't run, process on poll.
  if (sub.status === "ai_reviewing") {
    await processSubmissionAi(id);
    sub = await db.prepare("SELECT * FROM submissions WHERE id = ?").bind(id).first<Submission>();
  }

  const flags =
    (await db.prepare("SELECT kind, severity FROM submission_flags WHERE submission_id = ?").bind(id).all()).results ?? [];

  return NextResponse.json({
    status: sub!.status,
    verdict: sub!.ai_verdict_json ? JSON.parse(sub!.ai_verdict_json) : null,
    flags,
  });
}
