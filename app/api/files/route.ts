import { getDb } from "@/lib/cf";
import { getFile } from "@/lib/r2";
import { getCurrentUser } from "@/lib/session";

const PLACEHOLDER = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f3eee3"/><g fill="none" stroke="#8a968f" stroke-width="2"><circle cx="200" cy="170" r="46"/><path d="M120 300c20-46 60-70 80-70s60 24 80 70"/></g><text x="200" y="350" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#8a968f">photo</text></svg>`;

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!key || key.length > 512) return new Response("missing key", { status: 400 });

  const db = getDb();
  const submissionFile = await db
    .prepare(
      `SELECT s.user_id, s.status, t.org_id
       FROM submission_files f
       JOIN submissions s ON s.id = f.submission_id
       JOIN task_templates t ON t.id = s.task_template_id
       WHERE f.r2_key = ?`
    )
    .bind(key)
    .first<{ user_id: string; status: string; org_id: string }>();

  // Approved submission attachments are intentionally released with the public
  // deliverable. Everything else requires a user authorized for that record.
  let allowed = submissionFile?.status === "approved";
  const user = await getCurrentUser();
  if (user && !allowed) {
    if (submissionFile) {
      allowed =
        submissionFile.user_id === user.id ||
        user.role === "admin" ||
        (user.role === "org_member" && user.org_id === submissionFile.org_id);
    } else {
      const verification = await db
        .prepare("SELECT id FROM users WHERE benefitscal_screenshot_r2_key = ?")
        .bind(key)
        .first<{ id: string }>();
      const form = await db.prepare("SELECT user_id FROM cf888_forms WHERE r2_key = ?").bind(key).first<{ user_id: string }>();
      const auditPhoto = await db
        .prepare("SELECT a.user_id FROM audit_photos p JOIN audits a ON a.id = p.audit_id WHERE p.r2_key = ? OR p.thumb_r2_key = ?")
        .bind(key, key)
        .first<{ user_id: string }>();
      allowed =
        user.role === "admin" ||
        verification?.id === user.id ||
        form?.user_id === user.id ||
        auditPhoto?.user_id === user.id;
    }
  }

  if (!allowed) return new Response("not found", { status: 404 });

  try {
    const obj = await getFile(key);
    if (obj) {
      return new Response(obj.body as ReadableStream, {
        headers: {
          "Content-Type": obj.httpMetadata?.contentType ?? "image/jpeg",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }
  } catch {
    /* fall through to placeholder */
  }
  return new Response(PLACEHOLDER, { headers: { "Content-Type": "image/svg+xml" } });
}
