import { AlertTriangle } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { ResetButton } from "@/components/admin/reset-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reset demo data — Tended admin" };

export default async function AdminResetPage() {
  await requireAdmin();
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold text-ink">Reset demo data</h1>
        <p className="mt-1 text-body">Restore the pilot to a clean, known state.</p>
      </div>

      <div className="rounded-lg border border-line bg-amber-subtle p-5">
        <p className="flex items-center gap-2 font-medium text-amber">
          <AlertTriangle className="size-5" /> This wipes everything.
        </p>
        <p className="mt-2 text-sm text-body">
          Resetting deletes <strong>all</strong> users, organizations, tasks, submissions,
          uploaded files metadata, hours, CF 888 records, and feedback — then reinserts the
          original demo dataset. Anything created or changed during this session is permanently
          lost. There is no undo.
        </p>
      </div>

      <ResetButton />
    </div>
  );
}
