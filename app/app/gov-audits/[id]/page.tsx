import { notFound, redirect } from "next/navigation";
import { getDb } from "@/lib/cf";
import { requireUser } from "@/lib/session";
import { parseJson } from "@/lib/types";
import {
  type GovAuditSessionRow,
  type GovAuditDraft,
} from "@/lib/gov-audit";
import { GovAuditClient } from "./gov-audit-client";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getDict();
  return { title: t.govAudit.metaTitle };
}

export default async function GovAuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const db = getDb();
  const session = await db
    .prepare("SELECT * FROM gov_audit_sessions WHERE id = ?")
    .bind(id)
    .first<GovAuditSessionRow & { draft_json: string }>();
  if (!session) notFound();
  if (session.user_id !== user.id) redirect("/unauthorized");
  if (session.status !== "in_progress") redirect(`/app/gov-audits/${id}/done`);

  // The assigned target's optional URL hint lives on the task's deliverable spec.
  const task = await db
    .prepare("SELECT deliverable_spec_json FROM task_templates WHERE id = ?")
    .bind(session.task_template_id)
    .first<{ deliverable_spec_json: string }>();
  const spec = parseJson<{ target_url?: string }>(task?.deliverable_spec_json ?? "{}", {});

  const draft = parseJson<GovAuditDraft>(session.draft_json, {});

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <GovAuditClient
        sessionId={session.id}
        device={session.device}
        targetDescriptor={session.target_descriptor}
        targetUrlHint={spec.target_url ?? ""}
        viewerCity={user.city ?? null}
        viewerState={user.state ?? null}
        draft={draft}
      />
    </div>
  );
}
