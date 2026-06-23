"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirect } from "next/navigation";
import { logError } from "@/lib/audit";
import { getDb } from "@/lib/cf";
import { encryptField, encryptJson } from "@/lib/crypto";
import { nominatimGeocode } from "@/lib/places";
import { getCurrentUser } from "@/lib/session";
import type { Address } from "@/lib/types";

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/start");
  if (user.role !== "recipient") redirect("/unauthorized");

  try {
    const s = (k: string) => {
      const v = formData.get(k);
      return v == null ? "" : String(v).trim();
    };

    const address: Address = {
      line1: s("line1"),
      line2: s("line2") || undefined,
      city: s("city"),
      state: s("state").toUpperCase(),
      zip: s("zip"),
    };
    const firstName = s("first_name");
    const lastName = s("last_name");
    const legalName = [firstName, lastName].filter(Boolean).join(" ");

    const db = getDb();
    await db
      .prepare(
        `UPDATE users SET legal_name = ?, case_number = ?, dob = ?, address_json = ? WHERE id = ?`
      )
      .bind(
        await encryptField(legalName || null),
        await encryptField(s("case_number") || null),
        await encryptField(s("dob") || null),
        await encryptJson(address),
        user.id
      )
      .run();

    // Geocode in the background so save is never blocked by Nominatim. If the
    // lookup succeeds we re-encrypt the address_json with lat/lng appended;
    // failure logs and is otherwise silent. Falls back to inline if waitUntil
    // is unavailable (some dev contexts).
    const geocodeAndUpdate = async () => {
      try {
        const geo = await nominatimGeocode(
          [address.line1, address.city, address.state, address.zip].filter(Boolean).join(", ")
        );
        if (!geo) return;
        const augmented: Address = { ...address, lat: geo.lat, lng: geo.lng };
        await db
          .prepare(`UPDATE users SET address_json = ? WHERE id = ?`)
          .bind(await encryptJson(augmented), user.id)
          .run();
      } catch (geoErr) {
        await logError("updateProfile.geocode", geoErr, { userId: user.id });
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
    await logError("updateProfile", err, { userId: user.id });
    throw err;
  }

  redirect("/app/profile?saved=1");
}
