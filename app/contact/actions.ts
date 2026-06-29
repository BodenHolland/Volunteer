"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";
import { sendEmail } from "@/lib/notify";
import { rateLimit } from "@/lib/ratelimit";

// Inbox that contact + access-request messages are delivered to.
const NOTIFY_EMAIL = "hello@bodenholland.com";

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(120).optional().default(""),
  email: z.string().trim().email("Enter a valid email").max(200),
  message: z.string().trim().min(2, "A short message is required").max(4000),
});

export async function submitContact(formData: FormData) {
  // This action is unauthenticated, so throttle by client IP to stop a
  // feedback-table flood (mirrors the data-export routes' IP derivation +
  // rateLimit). Cloudflare's cf-connecting-ip is authoritative; fall back to
  // x-forwarded-for, then a constant.
  let ip = "anon";
  try {
    const h = await headers();
    ip =
      h.get("cf-connecting-ip") ||
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "anon";
  } catch {
    /* no request headers available — fall through to the shared "anon" bucket */
  }
  const rl = await rateLimit(`contact:${ip}`, 5, 60_000).catch(() => ({ ok: true }));
  if (!rl.ok) redirect("/contact?error=1");

  const parsed = ContactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    redirect("/contact?error=1");
  }

  const { name, email, message } = parsed.data;
  const body = name ? `${name}\n\n${message}` : message;

  await getDb()
    .prepare(
      `INSERT INTO feedback (id, user_id, email, body, created_at) VALUES (?,?,?,?,?)`
    )
    .bind(newId("fb"), null, email, body, Date.now())
    .run();

  // Notify the owner's inbox. Best-effort (logs until RESEND_API_KEY + EMAIL_FROM
  // are set); the message is already persisted above, so delivery can never lose it.
  await sendEmail({
    to: NOTIFY_EMAIL,
    subject: `Colift — contact message from ${email}`,
    text: `${body}\n\nReply directly to ${email}.`,
  });

  redirect("/contact?submitted=1");
}
