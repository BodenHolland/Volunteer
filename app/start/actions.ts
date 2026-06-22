"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirect } from "next/navigation";
import { writeAudit } from "@/lib/audit";
import { verifyBenefitsCalScreenshot } from "@/lib/benefitscal";
import { getDb, getEnv, isDemoMode } from "@/lib/cf";
import { decryptField, encryptField, encryptJson } from "@/lib/crypto";
import { newId } from "@/lib/ids";
import { putFile } from "@/lib/r2";
import { getCurrentUser } from "@/lib/session";

export async function submitLocation(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/start");
  const city = String(formData.get("city") ?? "Sacramento");
  const state = String(formData.get("state") ?? "CA");
  const intent = String(formData.get("intent") ?? "casual_volunteer");
  await getDb()
    .prepare("UPDATE users SET city = ?, state = ?, intent = ? WHERE id = ?")
    .bind(city, state, intent, user.id)
    .run();
  if (intent === "snap_cert") redirect("/start?step=pii");
  redirect("/start?step=welcome");
}

export async function submitPii(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/start");
  const legalName = String(formData.get("legal_name") ?? "").trim();
  const caseNumber = String(formData.get("case_number") ?? "").trim();
  const dob = String(formData.get("dob") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = {
    line1: String(formData.get("line1") ?? "").trim(),
    line2: String(formData.get("line2") ?? "").trim(),
    city: String(formData.get("city") ?? "Sacramento").trim(),
    state: String(formData.get("state") ?? "CA").trim(),
    zip: String(formData.get("zip") ?? "").trim(),
  };
  await getDb()
    .prepare("UPDATE users SET legal_name = ?, case_number = ?, address_json = ?, dob = ?, phone = ? WHERE id = ?")
    .bind(
      await encryptField(legalName),
      await encryptField(caseNumber),
      await encryptJson(address),
      await encryptField(dob),
      await encryptField(phone),
      user.id
    )
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
    // Store the screenshot key immediately; verification (below) may run async.
    await db
      .prepare("UPDATE users SET benefitscal_screenshot_r2_key = ? WHERE id = ?")
      .bind(key, user.id)
      .run();

    // Tier-3 enrollment verification: read the screenshot with the vision model
    // and compare against the recipient's (encrypted-at-rest) Section-1 PII.
    // Degrades gracefully when no OPENROUTER_API_KEY is set (manual review).
    const env = getEnv();
    const expectedName = await decryptField(user.legal_name);
    const expectedCaseNumber = await decryptField(user.case_number);

    const verifyAndRecord = async () => {
      const result = await verifyBenefitsCalScreenshot({
        r2Key: key,
        expectedName,
        expectedCaseNumber,
        apiKey: env.OPENROUTER_API_KEY,
        model: env.OPENROUTER_MODEL,
        siteUrl: env.OPENROUTER_SITE_URL,
        appName: env.OPENROUTER_APP_NAME,
      });
      if (result.verified) {
        await db
          .prepare("UPDATE users SET benefitscal_verified_at = ? WHERE id = ?")
          .bind(Date.now(), user.id)
          .run();
      }
      await writeAudit({
        actorUserId: user.id,
        action: "benefitscal_verified",
        entityType: "user",
        entityId: user.id,
        detail: {
          r2_key: key,
          verified: result.verified,
          confidence: result.confidence,
          reasoning: result.reasoning,
          matched: result.matched,
        },
      });
    };

    // With no API key (dev default) verification resolves instantly via the
    // graceful path, so run it inline. When a key is configured the network
    // call could be slow, so defer it with waitUntil to keep the redirect snappy.
    if (env.OPENROUTER_API_KEY) {
      try {
        getCloudflareContext().ctx.waitUntil(verifyAndRecord());
      } catch {
        // No waitUntil available (e.g. some dev contexts) — run inline best-effort.
        await verifyAndRecord();
      }
    } else {
      await verifyAndRecord();
    }
  } else if (isDemoMode()) {
    // DEMO_MODE only: no screenshot provided — mark verified so the flow proceeds.
    // In production the enrollment proof is required before the first CF 888.
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
