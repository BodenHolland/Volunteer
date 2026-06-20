"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/cf";
import { requireOrgAdmin } from "@/lib/session";
import { newId } from "@/lib/ids";
import { writeAudit } from "@/lib/audit";
import { sendEmail, appOrigin } from "@/lib/notify";
import type { OrgRole } from "@/lib/types";

const VALID_ROLES: OrgRole[] = ["reviewer", "org_admin"];

function redirectWith(status: string): never {
  redirect(`/org/team?status=${status}`);
}

export async function inviteMember(formData: FormData) {
  const admin = await requireOrgAdmin();
  if (!admin.org_id) redirectWith("no-org");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const rawRole = String(formData.get("org_role") ?? "");
  const orgRole = (VALID_ROLES as string[]).includes(rawRole) ? (rawRole as OrgRole) : "reviewer";

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    redirectWith("invalid-email");
  }

  const db = getDb();

  // Already a member of this org?
  const existingMember = await db
    .prepare("SELECT id FROM users WHERE org_id = ? AND lower(email) = ?")
    .bind(admin.org_id, email)
    .first<{ id: string }>();
  if (existingMember) redirectWith("already-member");

  // Pending invite already outstanding?
  const existingInvite = await db
    .prepare(
      "SELECT id FROM org_invites WHERE org_id = ? AND lower(email) = ? AND accepted_at IS NULL"
    )
    .bind(admin.org_id, email)
    .first<{ id: string }>();
  if (existingInvite) redirectWith("already-invited");

  const id = newId("invite");
  await db
    .prepare(
      "INSERT INTO org_invites (id, org_id, email, org_role, invited_by, created_at, accepted_at) VALUES (?,?,?,?,?,?,NULL)"
    )
    .bind(id, admin.org_id, email, orgRole, admin.id, Date.now())
    .run();

  const origin = await appOrigin();
  await sendEmail({
    to: email,
    subject: "You've been invited to a Tended organization",
    text: `You've been invited to join an organization on Tended as a ${
      orgRole === "org_admin" ? "team admin" : "reviewer"
    }.\n\nSign up or sign in with this email to accept:\n\n${origin}/signup\n\nIf you weren't expecting this, you can ignore this message.`,
  });

  await writeAudit({
    actorUserId: admin.id,
    action: "org_member_invited",
    entityType: "org_invite",
    entityId: id,
    detail: { org_id: admin.org_id, email, org_role: orgRole },
  });

  revalidatePath("/org/team");
  redirectWith("invited");
}

export async function revokeInvite(formData: FormData) {
  const admin = await requireOrgAdmin();
  if (!admin.org_id) redirectWith("no-org");

  const inviteId = String(formData.get("invite_id") ?? "").trim();
  if (!inviteId) redirectWith("error");

  const db = getDb();
  // Scope deletion to this admin's org so one org can't touch another's invites.
  const res = await db
    .prepare("DELETE FROM org_invites WHERE id = ? AND org_id = ? AND accepted_at IS NULL")
    .bind(inviteId, admin.org_id)
    .run();

  if (res.meta.changes > 0) {
    await writeAudit({
      actorUserId: admin.id,
      action: "org_invite_revoked",
      entityType: "org_invite",
      entityId: inviteId,
      detail: { org_id: admin.org_id },
    });
  }

  revalidatePath("/org/team");
  redirectWith("invite-revoked");
}

export async function removeMember(formData: FormData) {
  const admin = await requireOrgAdmin();
  if (!admin.org_id) redirectWith("no-org");

  const memberId = String(formData.get("member_id") ?? "").trim();
  if (!memberId) redirectWith("error");
  if (memberId === admin.id) redirectWith("cannot-remove-self");

  const db = getDb();
  // Verify the target is actually in this admin's org before mutating.
  const member = await db
    .prepare("SELECT id FROM users WHERE id = ? AND org_id = ?")
    .bind(memberId, admin.org_id)
    .first<{ id: string }>();
  if (!member) redirectWith("not-found");

  await db
    .prepare("UPDATE users SET org_id = NULL, org_role = NULL WHERE id = ? AND org_id = ?")
    .bind(memberId, admin.org_id)
    .run();

  await writeAudit({
    actorUserId: admin.id,
    action: "org_member_removed",
    entityType: "user",
    entityId: memberId,
    detail: { org_id: admin.org_id },
  });

  revalidatePath("/org/team");
  redirectWith("member-removed");
}

export async function changeMemberRole(formData: FormData) {
  const admin = await requireOrgAdmin();
  if (!admin.org_id) redirectWith("no-org");

  const memberId = String(formData.get("member_id") ?? "").trim();
  const rawRole = String(formData.get("org_role") ?? "");
  const orgRole = (VALID_ROLES as string[]).includes(rawRole) ? (rawRole as OrgRole) : null;
  if (!memberId || !orgRole) redirectWith("error");

  const db = getDb();
  const member = await db
    .prepare("SELECT id, org_role FROM users WHERE id = ? AND org_id = ?")
    .bind(memberId, admin.org_id)
    .first<{ id: string; org_role: OrgRole | null }>();
  if (!member) redirectWith("not-found");

  // Guard: don't allow demoting the last remaining org_admin.
  if (memberId === admin.id && orgRole !== "org_admin") {
    const adminCount = await db
      .prepare("SELECT COUNT(*) AS n FROM users WHERE org_id = ? AND org_role = 'org_admin'")
      .bind(admin.org_id)
      .first<{ n: number }>();
    if ((adminCount?.n ?? 0) <= 1) redirectWith("last-admin");
  }

  await db
    .prepare("UPDATE users SET org_role = ? WHERE id = ? AND org_id = ?")
    .bind(orgRole, memberId, admin.org_id)
    .run();

  await writeAudit({
    actorUserId: admin.id,
    action: "org_member_role_changed",
    entityType: "user",
    entityId: memberId,
    detail: { org_id: admin.org_id, from: member.org_role, to: orgRole },
  });

  revalidatePath("/org/team");
  redirectWith("role-changed");
}
