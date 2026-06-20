"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/cf";
import { getCurrentUser } from "@/lib/session";
import type { Intent } from "@/lib/types";

const VALID_INTENTS: Intent[] = ["snap_cert", "casual_volunteer", "other"];

async function requireRecipientUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/start");
  if (user.role !== "recipient") redirect("/unauthorized");
  return user;
}

export async function updateAccount(formData: FormData) {
  const user = await requireRecipientUser();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  await getDb()
    .prepare("UPDATE users SET email = ?, phone = ? WHERE id = ?")
    .bind(email || user.email, phone || null, user.id)
    .run();
  redirect("/app/settings?saved=account");
}

export async function updateIntent(formData: FormData) {
  const user = await requireRecipientUser();
  const raw = String(formData.get("intent") ?? "");
  const intent = (VALID_INTENTS as string[]).includes(raw) ? (raw as Intent) : user.intent;
  await getDb().prepare("UPDATE users SET intent = ? WHERE id = ?").bind(intent, user.id).run();
  redirect("/app/settings?saved=intent");
}
