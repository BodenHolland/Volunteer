import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireOrgAdmin } from "@/lib/session";
import { TaskForm } from "@/components/org/task-form";
import { createTask } from "@/app/org/tasks/task-form-actions";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create a task — colift" };

export default async function NewTaskPage() {
  await requireOrgAdmin();
  const { t } = await getDict();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/org/tasks" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">
        <ArrowLeft className="size-4" /> {t.createTask.backToTasks}
      </Link>
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold text-ink">{t.createTask.title}</h1>
        <p className="mt-1 text-body">{t.createTask.subtitle}</p>
      </div>
      <TaskForm action={createTask} submitLabel={t.createTask.submit} />
    </div>
  );
}
