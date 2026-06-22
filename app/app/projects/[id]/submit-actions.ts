"use server";

import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";
import { putFile } from "@/lib/r2";
import { getCurrentUser } from "@/lib/session";
import { processSubmissionAi } from "@/lib/process";
import { MIN_ENGAGEMENT_SECONDS } from "@/lib/engagement";
import { parseJson, type Submission } from "@/lib/types";

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function submitWork(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/start");
  const id = String(formData.get("submission_id") ?? "");
  const db = getDb();
  const sub = await db.prepare("SELECT * FROM submissions WHERE id = ?").bind(id).first<Submission>();
  if (!sub || sub.user_id !== user.id) redirect("/app/projects");
  if (!["committed", "in_progress", "needs_changes"].includes(sub.status)) {
    redirect(`/app/submissions/${id}`);
  }

  // Hours integrity: minimum-engagement floor — can't submit before genuine work.
  const measured = (sub as unknown as { measured_active_seconds: number }).measured_active_seconds ?? 0;
  if (measured < MIN_ENGAGEMENT_SECONDS) {
    redirect(`/app/projects/${id}?error=engagement`);
  }

  // ---- Written content (category-specific text) ----
  const text = String(formData.get("content") ?? "").trim();
  if (text) {
    await db.prepare("UPDATE submissions SET user_notes = ? WHERE id = ?").bind(text, id).run();
  }

  // ---- File uploads ----
  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const metaRaw = parseJson<{ lat?: number; lng?: number; captured_at?: number }[]>(
    String(formData.get("photo_meta") ?? "[]"),
    []
  );
  let idx = 0;
  for (const file of photos) {
    const buf = await file.arrayBuffer();
    const hash = await sha256Hex(buf);
    const key = `submissions/${id}/${newId("f")}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await putFile(key, buf, file.type || "image/jpeg");
    const m = metaRaw[idx] ?? {};
    const metadata = {
      mime: file.type || "image/jpeg",
      sha256: hash,
      geo: m.lat != null && m.lng != null ? { lat: m.lat, lng: m.lng } : undefined,
      captured_at: m.captured_at ?? null,
    };
    await db
      .prepare("INSERT INTO submission_files (id, submission_id, kind, r2_key, metadata_json) VALUES (?,?,?,?,?)")
      .bind(newId("file"), id, "photo", key, JSON.stringify(metadata))
      .run();
    idx++;
  }

  // ---- Move to AI review ----
  await db
    .prepare("UPDATE submissions SET status = 'ai_reviewing', submitted_at = ?, reviewer_notes = NULL WHERE id = ?")
    .bind(Date.now(), id)
    .run();

  // Kick off AI in the background; the status poll is a fallback if this is dropped.
  try {
    getCloudflareContext().ctx.waitUntil(processSubmissionAi(id));
  } catch {
    void processSubmissionAi(id);
  }

  redirect(`/app/submissions/${id}`);
}
