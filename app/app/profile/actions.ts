"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/cf";
import { getCurrentUser } from "@/lib/session";
import type { Address } from "@/lib/types";

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/start");
  if (user.role !== "recipient") redirect("/unauthorized");

  const s = (k: string) => {
    const v = formData.get(k);
    return v == null ? "" : String(v).trim();
  };

  const address: Address = {
    line1: s("line1"),
    line2: s("line2") || undefined,
    city: s("city"),
    state: s("state"),
    zip: s("zip"),
  };

  await getDb()
    .prepare(
      `UPDATE users SET legal_name = ?, case_number = ?, dob = ?, phone = ?, address_json = ? WHERE id = ?`
    )
    .bind(
      s("legal_name") || null,
      s("case_number") || null,
      s("dob") || null,
      s("phone") || null,
      JSON.stringify(address),
      user.id
    )
    .run();

  redirect("/app/profile?saved=1");
}
