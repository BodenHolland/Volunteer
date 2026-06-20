"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/cf";
import { requireOrgAdmin } from "@/lib/session";
import type { Address } from "@/lib/types";

export async function updateOrg(formData: FormData) {
  const user = await requireOrgAdmin();
  if (!user.org_id) redirect("/org");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/org/profile?error=name");

  const about_md = String(formData.get("about_md") ?? "").trim() || null;
  const contact_email = String(formData.get("contact_email") ?? "").trim() || null;
  const signing_authority_name = String(formData.get("signing_authority_name") ?? "").trim() || null;
  const signing_authority_title = String(formData.get("signing_authority_title") ?? "").trim() || null;

  const address: Address = {
    line1: String(formData.get("line1") ?? "").trim(),
    line2: String(formData.get("line2") ?? "").trim() || undefined,
    city: String(formData.get("city") ?? "").trim(),
    state: String(formData.get("state") ?? "").trim(),
    zip: String(formData.get("zip") ?? "").trim(),
  };
  const hasAddress = address.line1 || address.city || address.state || address.zip;
  const address_json = hasAddress ? JSON.stringify(address) : null;

  await getDb()
    .prepare(
      `UPDATE orgs SET name = ?, about_md = ?, contact_email = ?,
        signing_authority_name = ?, signing_authority_title = ?, address_json = ?
       WHERE id = ?`
    )
    .bind(name, about_md, contact_email, signing_authority_name, signing_authority_title, address_json, user.org_id)
    .run();

  revalidatePath("/org/profile");
  redirect("/org/profile?saved=1");
}
