"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";

const SignupSchema = z.object({
  name: z.string().trim().min(2, "Organization name is required").max(120),
  ein: z.string().trim().max(20).optional().default(""),
  contact_email: z.string().trim().email("Enter a valid email").max(200),
  contact_name: z.string().trim().min(2, "Your name is required").max(120),
  about: z.string().trim().max(2000).optional().default(""),
});

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "org"
  );
}

export async function createOrgSignup(formData: FormData) {
  const parsed = SignupSchema.safeParse({
    name: formData.get("name"),
    ein: formData.get("ein"),
    contact_email: formData.get("contact_email"),
    contact_name: formData.get("contact_name"),
    about: formData.get("about"),
  });

  if (!parsed.success) {
    redirect("/org/signup?error=1");
  }

  const { name, ein, contact_email, about } = parsed.data;
  const orgId = newId("org");
  const slug = `${slugify(name)}-${orgId.slice(-4)}`;

  await getDb()
    .prepare(
      `INSERT INTO orgs (id, slug, name, ein, contact_email, about_md, status, is_fictional, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`
    )
    .bind(
      orgId,
      slug,
      name,
      ein || null,
      contact_email,
      about || null,
      "pending",
      1,
      Date.now()
    )
    .run();

  redirect("/org/signup?submitted=1");
}
