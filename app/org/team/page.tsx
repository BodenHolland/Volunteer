import { Users2, Info } from "lucide-react";
import { requireOrgAdmin } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import type { OrgRole } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team — Tended" };

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string;
  org_role: OrgRole | null;
}

const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  org_admin: { label: "Admin", cls: "bg-forest-subtle text-forest" },
  reviewer: { label: "Reviewer", cls: "bg-section text-body" },
};

function initials(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default async function OrgTeamPage() {
  const user = await requireOrgAdmin();
  if (!user.org_id) {
    return <EmptyState icon={<Users2 />} title="No organization linked to this account." />;
  }

  const members: TeamMember[] =
    (await getDb()
      .prepare("SELECT id, full_name, email, org_role FROM users WHERE org_id = ? ORDER BY org_role DESC, full_name")
      .bind(user.org_id)
      .all<TeamMember>()).results ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold text-ink">Team</h1>
        <p className="mt-1 text-body">People who can review and manage work for your organization.</p>
      </div>

      {members.length === 0 ? (
        <EmptyState icon={<Users2 />} title="No team members yet." />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
          {members.map((m) => {
            const role = m.org_role ? ROLE_LABELS[m.org_role] : null;
            return (
              <li key={m.id} className="flex items-center gap-4 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest-subtle text-sm font-semibold text-forest" aria-hidden>
                  {initials(m.full_name, m.email)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{m.full_name ?? "Unnamed member"}</p>
                  <p className="truncate text-sm text-meta">{m.email}</p>
                </div>
                {role && (
                  <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium", role.cls)}>
                    {role.label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="flex items-center gap-1.5 text-sm text-meta">
        <Info className="size-4" /> Team management is display-only in this demo.
      </p>
    </div>
  );
}
