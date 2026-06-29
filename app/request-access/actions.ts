"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";
import { sendEmail } from "@/lib/notify";

// Where access requests are delivered. Change this to route requests elsewhere.
const NOTIFY_EMAIL = "hello@bodenholland.com";

const RequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(200),
  org: z.string().trim().min(1, "Tell us your organization").max(160),
  role: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().max(4000).optional().default(""),
});

export async function requestAccess(formData: FormData) {
  const parsed = RequestSchema.safeParse({
    email: formData.get("email"),
    org: formData.get("org"),
    role: formData.get("role"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    redirect("/request-access?error=1");
  }
  const { email, org, role, message } = parsed.data;

  const body =
    `ORG ACCESS REQUEST\n` +
    `Org: ${org}\n` +
    `Email: ${email}\n` +
    (role ? `Role: ${role}\n` : "") +
    (message ? `\n${message}\n` : "");

  // Persist first — the request survives even if email delivery isn't configured
  // yet (sendEmail logs instead of sending until RESEND_API_KEY + EMAIL_FROM are set).
  await getDb()
    .prepare(`INSERT INTO feedback (id, user_id, email, body, created_at) VALUES (?,?,?,?,?)`)
    .bind(newId("req"), null, email, body, Date.now())
    .run();

  // Notify the owner's inbox. Best-effort: sendEmail swallows its own errors, so a
  // mail outage never loses the request (it's already stored above).
  await sendEmail({
    to: NOTIFY_EMAIL,
    subject: `Colift — org access request: ${org}`,
    text: `${body}\nReply directly to ${email}.`,
  });

  redirect("/request-access?submitted=1");
}
