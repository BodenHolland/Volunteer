import { UsersRound } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";
export const metadata = { title: "Users — colift admin" };

interface UserRow {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  org_role: string | null;
  intent: string;
  org_name: string | null;
}

function roleLabel(role: string, orgRole: string | null): string {
  if (role === "org_member") return orgRole ? `org · ${orgRole}` : "org member";
  return role;
}

export default async function AdminUsersPage() {
  await requireAdmin();
  const rows = (await getDb()
    .prepare(
      `SELECT u.id, u.full_name, u.email, u.role, u.org_role, u.intent, o.name AS org_name
       FROM users u
       LEFT JOIN orgs o ON o.id = u.org_id
       ORDER BY u.role, u.full_name`
    )
    .all<UserRow>()).results ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold text-ink">Users</h1>
        <p className="mt-1 text-body">{rows.length} accounts in the dataset.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<UsersRound />} title="No users found." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white">
          <div className="hidden items-center gap-4 border-b border-line bg-section px-4 py-2.5 text-xs font-medium text-meta md:flex">
            <span className="flex-1">Name</span>
            <span className="w-56">Email</span>
            <span className="w-32">Role</span>
            <span className="w-32">Intent</span>
            <span className="w-44">Organization</span>
          </div>
          <ul className="divide-y divide-line">
            {rows.map((u) => (
              <li key={u.id} className="flex flex-col gap-1 px-4 py-3 md:flex-row md:items-center md:gap-4">
                <span className="flex-1 font-medium text-ink">{u.full_name ?? "—"}</span>
                <span className="w-56 truncate text-sm text-body">{u.email}</span>
                <span className="w-32 text-sm text-body">{roleLabel(u.role, u.org_role)}</span>
                <span className="w-32 text-sm text-body">{u.intent}</span>
                <span className="w-44 truncate text-sm text-body">{u.org_name ?? "—"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
