import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireOrgAdmin } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { TaskForm } from "@/components/org/task-form";
import { updateTask } from "@/app/org/tasks/task-form-actions";
import type { TaskTemplate } from "@/lib/types";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit task | colift" };

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireOrgAdmin();
  const { t } = await getDict();

  const task = await getDb()
    .prepare("SELECT * FROM task_templates WHERE id = ?")
    .bind(id)
    .first<TaskTemplate>();
  if (!task) notFound();
  if (task.org_id !== user.org_id) redirect("/unauthorized");

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/org/tasks" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">
        <ArrowLeft className="size-4" /> {t.editTask.backToTasks}
      </Link>
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold text-ink">{t.editTask.title}</h1>
        <p className="mt-1 text-body">{t.editTask.subtitle}</p>
      </div>
      <TaskForm action={updateTask} task={task} submitLabel={t.editTask.submit} hiddenFields={{ task_id: task.id }} />
    </div>
  );
}
