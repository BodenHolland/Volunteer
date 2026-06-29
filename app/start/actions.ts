"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirect } from "next/navigation";
import { logError, writeAudit } from "@/lib/audit";
import { getDb } from "@/lib/cf";
import { encryptField, encryptJson } from "@/lib/crypto";
import { newId } from "@/lib/ids";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";
import { nominatimGeocode, nominatimSearch } from "@/lib/places";
import type { Intent } from "@/lib/types";

// Mirror app/app/settings/actions.ts: validate intent against the allowed enum
// and bound free-text input so onboarding writes can't store oversized values.
const VALID_INTENTS: Intent[] = ["snap_cert", "casual_volunteer", "other"];
const MAX_TEXT = 200;
// Forgiving plausible-email check (the new-org contact is optional contact info,
// not an auth credential).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trim then cap a free-text field to a sane max length. */
function capText(v: FormDataEntryValue | null, max = MAX_TEXT): string {
  return String(v ?? "").trim().slice(0, max);
}

export interface AddressSuggestion {
  place_id: string;
  display: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
}

/**
 * Street-address autocomplete via Nominatim. Reuses the same free OSM endpoint
 * the food-audit store search uses; here we map the parsed result down to the
 * five fields the onboarding PII form needs.
 */
export async function addressAutocompleteAction(query: string): Promise<AddressSuggestion[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  // Throttle per-user to protect the free external Nominatim endpoint from being
  // hammered by autocomplete keystrokes (mirrors the status-route rate limit).
  const rl = await rateLimit(`address-autocomplete:${user.id}`, 30, 60_000).catch(() => ({
    ok: true,
  }));
  if (!rl.ok) return [];
  // Cap the query length before it ever leaves the Worker.
  const q = query.trim().slice(0, MAX_TEXT);
  if (q.length < 2) return [];
  let hits;
  try {
    hits = await nominatimSearch(q, undefined, 5);
  } catch (err) {
    await writeAudit({
      actorUserId: user.id,
      action: "server_error",
      entityType: "error",
      entityId: "addressAutocompleteAction",
      detail: { message: err instanceof Error ? err.message : String(err), query },
    });
    return [];
  }
  return hits.map((h) => {
    // h.address is "house_number street, city state, zip", split apart with a
    // forgiving regex so we can repopulate the form even when Nominatim returns
    // an incomplete address.
    const parts = h.address.split(",").map((s) => s.trim());
    const line1 = parts[0] ?? "";
    const cityStateZip = parts.slice(1).join(", ");
    const zipMatch = cityStateZip.match(/\b(\d{5})(?:-\d{4})?\b/);
    const stateMatch = cityStateZip.match(/\b([A-Z]{2})\b/);
    const city = parts[1] ?? "";
    return {
      place_id: h.place_id ?? `${h.lat},${h.lng}`,
      display: h.address,
      line1,
      city,
      state: stateMatch?.[1] ?? "",
      zip: zipMatch?.[1] ?? "",
    };
  });
}

export async function submitLocation(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/start");
  const city = capText(formData.get("city"));
  const state = String(formData.get("state") ?? "").trim().toUpperCase().slice(0, 2);
  const rawIntent = String(formData.get("intent") ?? "casual_volunteer");
  const intent: Intent = (VALID_INTENTS as string[]).includes(rawIntent)
    ? (rawIntent as Intent)
    : "casual_volunteer";
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
  try {
    // Cap each free-text field so PII writes can't store oversized values.
    const firstName = capText(formData.get("first_name"));
    const lastName = capText(formData.get("last_name"));
    const legalName = [firstName, lastName].filter(Boolean).join(" ");
    const caseNumber = capText(formData.get("case_number"));
    const dob = capText(formData.get("dob"));
    // Store phone as digits only, the formatted "(916) 555-0142" the user typed
    // is a display detail, not the source of truth.
    const phone = String(formData.get("phone") ?? "").replace(/\D/g, "").slice(0, 10);
    const address: Record<string, string | number | undefined> = {
      line1: capText(formData.get("line1")),
      line2: capText(formData.get("line2")),
      city: capText(formData.get("city")),
      state: String(formData.get("state") ?? "").trim().toUpperCase().slice(0, 2),
      zip: capText(formData.get("zip")),
    };

    const db = getDb();
    await db
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

    // Defer geocoding so a slow / blocked Nominatim never holds up onboarding.
    // On success we re-encrypt the address_json with lat/lng appended.
    const geocodeAndUpdate = async () => {
      try {
        const geo = await nominatimGeocode(
          [address.line1, address.city, address.state, address.zip].filter(Boolean).join(", ")
        );
        if (!geo) return;
        const augmented = { ...address, lat: geo.lat, lng: geo.lng };
        await db
          .prepare("UPDATE users SET address_json = ? WHERE id = ?")
          .bind(await encryptJson(augmented), user.id)
          .run();
      } catch (geoErr) {
        await logError("submitPii.geocode", geoErr, { userId: user.id });
      }
    };
    try {
      getCloudflareContext().ctx.waitUntil(geocodeAndUpdate());
    } catch {
      await geocodeAndUpdate();
    }
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    await logError("submitPii", err, { userId: user.id });
    throw err;
  }
  redirect("/start?step=welcome");
}

export async function submitOrgPick(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/start");
  const db = getDb();
  const choice = String(formData.get("org_choice") ?? "");

  if (choice === "__new__") {
    const name = capText(formData.get("new_org_name"));
    const ein = capText(formData.get("new_org_ein"));
    const contact = capText(formData.get("new_org_contact"));
    if (!name) redirect("/start?step=orgpick&error=org");
    // Reject an implausible contact email rather than persisting garbage; an
    // empty contact stays allowed (stored as NULL below).
    if (contact && !EMAIL_RE.test(contact)) redirect("/start?step=orgpick&error=org");
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

  // PRIVILEGE-ESCALATION FIX (H1): never derive org membership from client-
  // supplied form fields. A signed-in recipient could otherwise POST any
  // org_id + org_role ("org_admin") and seize control of an arbitrary org.
  // Mirror the canonical invite path (app/auth-actions.ts): an org join is only
  // valid against a pending org_invites row addressed to THIS user's email, and
  // org_id / org_role come from the invite — not the form. The org_choice the
  // user picked must match the org they were actually invited to.
  const invite = await db
    .prepare(
      "SELECT id, org_id, org_role FROM org_invites WHERE email = ? AND accepted_at IS NULL ORDER BY created_at DESC LIMIT 1"
    )
    .bind(user.email)
    .first<{ id: string; org_id: string; org_role: string }>();
  if (!invite || invite.org_id !== choice) {
    // No matching invite — refuse silently to the org-pick step rather than
    // granting any membership.
    redirect("/start?step=orgpick&error=invite");
  }
  await db
    .prepare("UPDATE users SET role = 'org_member', org_role = ?, org_id = ? WHERE id = ?")
    .bind(invite!.org_role, invite!.org_id, user.id)
    .run();
  await db.prepare("UPDATE org_invites SET accepted_at = ? WHERE id = ?").bind(Date.now(), invite!.id).run();
  redirect("/org");
}
