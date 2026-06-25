"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/cf";
import { requireUser } from "@/lib/session";

export async function pickIntent(formData: FormData) {
  const user = await requireUser();
  const db = getDb();
  const choice = String(formData.get("choice") ?? "");

  if (choice === "org_member") {
    await db
      .prepare("UPDATE users SET role = 'org_member', intent = 'n/a' WHERE id = ?")
      .bind(user.id)
      .run();
    redirect("/start?step=orgpick");
  }

  const intent =
    choice === "snap_cert" ? "snap_cert" : choice === "casual_volunteer" ? "casual_volunteer" : "n/a";
  await db
    .prepare("UPDATE users SET role = 'recipient', intent = ? WHERE id = ?")
    .bind(intent, user.id)
    .run();
  redirect("/start?step=location");
}
