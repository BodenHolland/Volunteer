import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireOrgAdmin } from "@/lib/session";
import { TaskForm } from "@/components/org/task-form";
import { createTask } from "@/app/org/tasks/task-form-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create a task — Tended" };

export default async function NewTaskPage() {
  await requireOrgAdmin();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/org/tasks" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">
        <ArrowLeft className="size-4" /> Tasks
      </Link>
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold text-ink">Create a task</h1>
        <p className="mt-1 text-body">Describe the civic work and what a finished submission looks like.</p>
      </div>
      <TaskForm action={createTask} submitLabel="Create task" />
    </div>
  );
}
