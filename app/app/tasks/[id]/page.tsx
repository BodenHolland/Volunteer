import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ListChecks, CheckCircle2 } from "lucide-react";
import { getTask } from "@/lib/queries";
import { commitToTask } from "@/app/app/project-actions";
import { Markdown } from "@/components/markdown";
import { OrgThumb } from "@/components/org-thumb";
import { Button } from "@/components/ui/button";
import { HeadlineTag, SecondaryTag, LOCATION_LABEL, CATEGORY_LABEL } from "@/components/ui/tag";
import { parseJson, type ChecklistItem } from "@/lib/types";
import { getLocale } from "@/lib/i18n";

const COPY = {
  en: {
    allTasks: "All tasks",
    aboutTask: "About this task",
    whatYoullDo: "What you'll do",
    optional: "(optional)",
    sidebarNote:
      "You'll log your time as you work. Credited hours reflect your measured engagement — do as much or as little as you like.",
    commit: "Commit to task",
  },
  es: {
    allTasks: "Todas las tareas",
    aboutTask: "Acerca de esta tarea",
    whatYoullDo: "Lo que harás",
    optional: "(opcional)",
    sidebarNote:
      "Registrarás tu tiempo mientras trabajas. Las horas acreditadas reflejan tu participación medida — haz tanto o tan poco como quieras.",
    commit: "Comprometerme con la tarea",
  },
} as const;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTask(id);
  return { title: task ? `${task.title} — Tended` : "Task — Tended" };
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();

  const checklist = parseJson<ChecklistItem[]>(task.checklist_json, []);
  const locale = await getLocale();
  const c = COPY[locale];

  return (
    <div>
      <Link href="/app/tasks" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">
        <ArrowLeft className="size-4" /> {c.allTasks}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <OrgThumb name={task.org.name} slug={task.org.slug} size={72} className="h-[72px] w-[72px]" />
            <div>
              <h1 className="text-[28px] font-semibold leading-tight text-ink">{task.title}</h1>
              <p className="mt-1 text-[15px] font-medium text-ink">{task.org.name}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <HeadlineTag>{LOCATION_LABEL[task.location_kind]}</HeadlineTag>
            <SecondaryTag>{CATEGORY_LABEL[task.category]}</SecondaryTag>
          </div>

          <section className="mt-8">
            <h2 className="mb-2 text-[22px] font-semibold text-ink">{c.aboutTask}</h2>
            <Markdown>{task.instructions_md}</Markdown>
          </section>

          <section className="mt-8">
            <h2 className="mb-3 flex items-center gap-2 text-[22px] font-semibold text-ink">
              <ListChecks className="size-5 text-forest" /> {c.whatYoullDo}
            </h2>
            <ul className="space-y-2">
              {checklist.map((item) => (
                <li key={item.id} className="flex items-start gap-2.5 text-body">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-forest" strokeWidth={1.5} />
                  <span>
                    {item.label}
                    {!item.required && <span className="ml-1.5 text-xs text-meta">{c.optional}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-lg border border-line bg-white p-5">
            <p className="rounded-md bg-section p-3 text-xs text-body">
              {c.sidebarNote}
            </p>
            <form action={commitToTask} className="mt-4">
              <input type="hidden" name="task_id" value={task.id} />
              <Button type="submit" className="w-full">{c.commit}</Button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
