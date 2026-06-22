import { ScrollText } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { getRecentAudit, type AuditRow } from "@/lib/observability";
import { EmptyState } from "@/components/empty-state";
import { relativeTime } from "@/lib/time";
import { parseJson } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit log — Tended admin" };

// The common actions written across the app (per lib/audit.ts call sites).
const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "login", label: "Login" },
  { value: "login_failed", label: "Login failed" },
  { value: "signup", label: "Signup" },
  { value: "password_reset", label: "Password reset" },
  { value: "submission_approved", label: "Submission approved" },
  { value: "task_gate_approved", label: "Task gate approved" },
  { value: "cf888_generated", label: "CF 888 generated" },
  { value: "account_deleted", label: "Account deleted" },
  { value: "caps_calibrated", label: "Caps calibrated" },
];

// Auth/security-sensitive actions get a louder chip.
const SECURITY_ACTIONS = new Set(["login_failed", "account_deleted", "password_reset"]);
const SUCCESS_ACTIONS = new Set(["login", "signup", "submission_approved", "task_gate_approved", "cf888_generated", "caps_calibrated"]);

function actionChipClass(action: string): string {
  if (SECURITY_ACTIONS.has(action)) return "bg-brick-subtle text-brick";
  if (SUCCESS_ACTIONS.has(action)) return "bg-forest-subtle text-forest";
  return "bg-section text-ink";
}

/** Build a short, human-readable summary from the detail_json blob. */
function summarize(detailJson: string | null): string {
  const detail = parseJson<Record<string, unknown>>(detailJson, {});
  const keys = Object.keys(detail);
  if (keys.length === 0) return "—";
  // Prefer a few well-known keys, else show up to 3 key=value pairs.
  const preferred = ["month", "hours", "hours_credited", "reason", "email", "ip", "status", "org"];
  const ordered = [
    ...preferred.filter((k) => k in detail),
    ...keys.filter((k) => !preferred.includes(k)),
  ];
  return ordered
    .slice(0, 3)
    .map((k) => {
      const v = detail[k];
      const val = typeof v === "object" ? JSON.stringify(v) : String(v);
      return `${k}: ${val.length > 48 ? `${val.slice(0, 48)}…` : val}`;
    })
    .join(" · ");
}

function actorLabel(row: AuditRow): string {
  if (row.actor_name) return row.actor_name;
  if (row.actor_email) return row.actor_email;
  if (row.actor_user_id) return row.actor_user_id;
  return "System";
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  await requireAdmin();
  const { action } = await searchParams;
  const active = action && FILTERS.some((f) => f.value === action) ? action : "";
  const rows = await getRecentAudit(200, active || undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold text-ink">Audit log</h1>
        <p className="mt-1 text-body">
          The {rows.length} most recent sensitive actions, newest first. Immutable, append-only.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value || "all"}
            href={f.value ? `/admin/audit?action=${f.value}` : "/admin/audit"}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              active === f.value ? "bg-forest text-white" : "bg-section text-body hover:bg-forest-subtle"
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <EmptyState icon={<ScrollText />} title="No audit entries yet." body="Sensitive actions will appear here as they happen." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white">
          <div className="hidden items-center gap-4 border-b border-line bg-section px-4 py-2.5 text-xs font-medium text-meta md:flex">
            <span className="w-24">Time</span>
            <span className="w-44">Action</span>
            <span className="w-44">Actor</span>
            <span className="w-36">Entity</span>
            <span className="flex-1">Detail</span>
          </div>
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:gap-4">
                <span className="w-24 shrink-0 text-sm text-meta">{relativeTime(r.created_at)}</span>
                <span className="w-44 shrink-0">
                  <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium", actionChipClass(r.action))}>
                    {r.action}
                  </span>
                </span>
                <span className="w-44 shrink-0 truncate text-sm text-ink" title={r.actor_email ?? undefined}>
                  {actorLabel(r)}
                </span>
                <span className="w-36 shrink-0 truncate text-sm text-body">
                  {r.entity_type ? r.entity_type : "—"}
                </span>
                <span className="flex-1 truncate text-sm text-body">{summarize(r.detail_json)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
