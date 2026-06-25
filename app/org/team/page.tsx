import { Users2, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { requireOrgAdmin } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { OrgRole } from "@/lib/types";
import { inviteMember, revokeInvite, removeMember, changeMemberRole } from "./actions";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team | colift" };

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string;
  org_role: OrgRole | null;
}

interface PendingInvite {
  id: string;
  email: string;
  org_role: OrgRole;
  created_at: number;
}

function initials(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default async function OrgTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { t } = await getDict();

  const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
    org_admin: { label: t.orgTeam.roleAdmin, cls: "bg-forest-subtle text-forest" },
    reviewer: { label: t.orgTeam.roleReviewer, cls: "bg-section text-body" },
  };

  const STATUS_MESSAGES: Record<string, { tone: "ok" | "err"; text: string }> = {
    invited: { tone: "ok", text: t.orgTeam.statusInvited },
    "invite-revoked": { tone: "ok", text: t.orgTeam.statusInviteRevoked },
    "member-removed": { tone: "ok", text: t.orgTeam.statusMemberRemoved },
    "role-changed": { tone: "ok", text: t.orgTeam.statusRoleChanged },
    "invalid-email": { tone: "err", text: t.orgTeam.errorInvalidEmail },
    "already-member": { tone: "err", text: t.orgTeam.errorAlreadyMember },
    "already-invited": { tone: "err", text: t.orgTeam.errorAlreadyInvited },
    "cannot-remove-self": { tone: "err", text: t.orgTeam.errorCannotRemoveSelf },
    "last-admin": { tone: "err", text: t.orgTeam.errorLastAdmin },
    "not-found": { tone: "err", text: t.orgTeam.errorNotFound },
    error: { tone: "err", text: t.orgTeam.errorGeneric },
    "no-org": { tone: "err", text: t.orgTeam.errorNoOrg },
  };

  const user = await requireOrgAdmin();
  if (!user.org_id) {
    return <EmptyState icon={<Users2 />} title={t.orgTeam.errorNoOrg} />;
  }

  const { status } = await searchParams;
  const message = status ? STATUS_MESSAGES[status] : null;
  const db = getDb();

  const members: TeamMember[] =
    (await db
      .prepare(
        "SELECT id, full_name, email, org_role FROM users WHERE org_id = ? ORDER BY org_role DESC, full_name"
      )
      .bind(user.org_id)
      .all<TeamMember>()).results ?? [];

  const pending: PendingInvite[] =
    (await db
      .prepare(
        "SELECT id, email, org_role, created_at FROM org_invites WHERE org_id = ? AND accepted_at IS NULL ORDER BY created_at DESC"
      )
      .bind(user.org_id)
      .all<PendingInvite>()).results ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold text-ink">{t.orgTeam.title}</h1>
        <p className="mt-1 text-body">{t.orgTeam.subtitle}</p>
      </div>

      {message && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium",
            message.tone === "ok"
              ? "border-forest/30 bg-forest-subtle text-forest"
              : "border-brick/30 bg-brick-subtle text-brick"
          )}
        >
          {message.tone === "ok" ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
          {message.text}
        </div>
      )}

      {/* Invite */}
      <section className="space-y-4 rounded-lg border border-line bg-white p-5">
        <h2 className="text-base font-semibold text-ink">{t.orgTeam.inviteSection}</h2>
        <form action={inviteMember} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1 space-y-1.5">
            <Label htmlFor="invite-email">{t.orgTeam.emailLabel}</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              required
              placeholder="teammate@org.org"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">{t.orgTeam.roleLabel}</Label>
            <select
              id="invite-role"
              name="org_role"
              defaultValue="reviewer"
              className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
            >
              <option value="reviewer">{t.orgTeam.roleReviewer}</option>
              <option value="org_admin">{t.orgTeam.roleAdmin}</option>
            </select>
          </div>
          <Button type="submit">{t.orgTeam.sendInvite}</Button>
        </form>
        <p className="text-xs text-meta">
          {t.orgTeam.roleHelp}
        </p>
      </section>

      {/* Pending invites */}
      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-ink">{t.orgTeam.pendingInvitations}</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
            {pending.map((inv) => {
              const role = ROLE_LABELS[inv.org_role];
              return (
                <li key={inv.id} className="flex items-center gap-4 p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-section text-meta" aria-hidden>
                    <Mail className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{inv.email}</p>
                    <p className="truncate text-sm text-meta">{t.orgTeam.invitedStatus}</p>
                  </div>
                  {role && (
                    <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium", role.cls)}>
                      {role.label}
                    </span>
                  )}
                  <form action={revokeInvite}>
                    <input type="hidden" name="invite_id" value={inv.id} />
                    <Button type="submit" variant="destructive" size="sm">{t.orgTeam.revoke}</Button>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Members */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink">{t.orgTeam.membersSection}</h2>
        {members.length === 0 ? (
          <EmptyState icon={<Users2 />} title={t.orgTeam.noMembers} />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
            {members.map((m) => {
              const isSelf = m.id === user.id;
              return (
                <li key={m.id} className="flex flex-wrap items-center gap-4 p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest-subtle text-sm font-semibold text-forest" aria-hidden>
                    {initials(m.full_name, m.email)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">
                      {m.full_name ?? t.orgTeam.unnamedMember}
                      {isSelf && <span className="ml-2 text-xs font-normal text-meta">{t.orgTeam.youLabel}</span>}
                    </p>
                    <p className="truncate text-sm text-meta">{m.email}</p>
                  </div>

                  <form action={changeMemberRole} className="flex items-center gap-2">
                    <input type="hidden" name="member_id" value={m.id} />
                    <Label htmlFor={`role-${m.id}`} className="sr-only">{t.orgTeam.roleLabel}</Label>
                    <select
                      id={`role-${m.id}`}
                      name="org_role"
                      defaultValue={m.org_role ?? "reviewer"}
                      className="h-9 rounded-md border border-line bg-white px-2.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
                    >
                      <option value="reviewer">{t.orgTeam.roleReviewer}</option>
                      <option value="org_admin">{t.orgTeam.roleAdmin}</option>
                    </select>
                    <Button type="submit" variant="secondary" size="sm">{t.orgTeam.updateRole}</Button>
                  </form>

                  {!isSelf && (
                    <form action={removeMember}>
                      <input type="hidden" name="member_id" value={m.id} />
                      <Button type="submit" variant="destructive" size="sm">{t.orgTeam.remove}</Button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
