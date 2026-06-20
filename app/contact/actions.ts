"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(120).optional().default(""),
  email: z.string().trim().email("Enter a valid email").max(200),
  message: z.string().trim().min(2, "A short message is required").max(4000),
});

export async function submitContact(formData: FormData) {
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

  redirect("/contact?submitted=1");
}
