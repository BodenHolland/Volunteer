"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";
import { putFile } from "@/lib/r2";
import { getCurrentUser } from "@/lib/session";

export async function submitLocation(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/start");
  const city = String(formData.get("city") ?? "San Francisco");
  const state = String(formData.get("state") ?? "CA");
  const intent = String(formData.get("intent") ?? "casual_volunteer");
  await getDb()
    .prepare("UPDATE users SET city = ?, state = ?, intent = ? WHERE id = ?")
    .bind(city, state, intent, user.id)
    .run();
  if (intent === "snap_cert") redirect("/start?step=phone");
  redirect("/start?step=welcome");
}

export async function submitPhone(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/start");
  const phone = String(formData.get("phone") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  // Demo: accept any 6-digit code (hint says 123456).
  if (!/^\d{6}$/.test(code)) redirect("/start?step=phone&error=code");
  await getDb()
    .prepare("UPDATE users SET phone = ?, phone_verified_at = ? WHERE id = ?")
    .bind(phone, Date.now(), user.id)
    .run();
  redirect("/start?step=pii");
}

export async function submitPii(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/start");
  const legalName = String(formData.get("legal_name") ?? "").trim();
  const caseNumber = String(formData.get("case_number") ?? "").trim();
  const dob = String(formData.get("dob") ?? "").trim();
  const address = {
    line1: String(formData.get("line1") ?? "").trim(),
    line2: String(formData.get("line2") ?? "").trim(),
    city: String(formData.get("city") ?? "San Francisco").trim(),
    state: String(formData.get("state") ?? "CA").trim(),
    zip: String(formData.get("zip") ?? "").trim(),
  };
  await getDb()
    .prepare("UPDATE users SET legal_name = ?, case_number = ?, address_json = ?, dob = ? WHERE id = ?")
    .bind(legalName, caseNumber, JSON.stringify(address), dob, user.id)
    .run();
  redirect("/start?step=benefitscal");
}

export async function submitBenefitsCal(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/start");
  const file = formData.get("screenshot");
  const db = getDb();
  if (file && file instanceof File && file.size > 0) {
    const key = `verification/${user.id}/benefitscal.png`;
    await putFile(key, await file.arrayBuffer(), file.type || "image/png");
    await db
      .prepare("UPDATE users SET benefitscal_screenshot_r2_key = ?, benefitscal_verified_at = ? WHERE id = ?")
      .bind(key, Date.now(), user.id)
      .run();
  } else {
    // Skip allowed in demo; still mark verified so the flow proceeds.
    await db
      .prepare("UPDATE users SET benefitscal_verified_at = ? WHERE id = ?")
      .bind(Date.now(), user.id)
      .run();
  }
  redirect("/start?step=welcome");
}

export async function submitOrgPick(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/start");
  const db = getDb();
  const choice = String(formData.get("org_choice") ?? "");

  if (choice === "__new__") {
    const name = String(formData.get("new_org_name") ?? "").trim();
    const ein = String(formData.get("new_org_ein") ?? "").trim();
    const contact = String(formData.get("new_org_contact") ?? "").trim();
    if (!name) redirect("/start?step=orgpick&error=org");
    const orgId = newId("org");
    const slug =
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || orgId;
    await db
      .prepare(
        "INSERT INTO orgs (id, slug, name, ein, contact_email, status, is_fictional, created_at) VALUES (?,?,?,?,?,?,?,?)"
      )
      .bind(orgId, `${slug}-${orgId.slice(-4)}`, name, ein || null, contact || null, "active", 1, Date.now())
      .run();
    await db
      .prepare("UPDATE users SET role = 'org_member', org_role = 'org_admin', org_id = ? WHERE id = ?")
      .bind(orgId, user.id)
      .run();
    redirect("/org");
  }

  const orgRole = String(formData.get("org_role") ?? "reviewer");
  await db
    .prepare("UPDATE users SET role = 'org_member', org_role = ?, org_id = ? WHERE id = ?")
    .bind(orgRole, choice, user.id)
    .run();
  redirect("/org");
}
