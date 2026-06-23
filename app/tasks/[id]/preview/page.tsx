import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ListChecks, Gift, CheckCircle2, LogIn } from "lucide-react";
import { getTask } from "@/lib/queries";
import { Markdown } from "@/components/markdown";
import { OrgThumb } from "@/components/org-thumb";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { HeadlineTag, SecondaryTag, DeviceTag, LOCATION_LABEL, CATEGORY_LABEL } from "@/components/ui/tag";
import { parseJson, type ChecklistItem } from "@/lib/types";
import { formatHours } from "@/lib/time";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const COPY = {
  en: {
    hrs: "hrs",
    aboutTask: "About this task",
    whatYoullDo: "What you'll do",
    optional: "(optional)",
    estimated: "Estimated",
    hoursCap: "Hours cap",
    hours: "hours",
    signInCallout: "Sign in to commit to this task, log your time, and submit your work for review.",
    signInToCommit: "Sign in to commit",
  },
  es: {
    hrs: "h",
    aboutTask: "Sobre esta tarea",
    whatYoullDo: "Lo que harás",
    optional: "(opcional)",
    estimated: "Estimado",
    hoursCap: "Límite de horas",
    hours: "horas",
    signInCallout: "Inicia sesión para comprometerte con esta tarea, registrar tu tiempo y enviar tu trabajo para revisión.",
    signInToCommit: "Inicia sesión para comprometerte",
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTask(id);
  return { title: task ? `${task.title} — Tended` : "Task — Tended" };
}

export default async function TaskPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();

  const checklist = parseJson<ChecklistItem[]>(task.checklist_json, []);
  const locale = await getLocale();
  const c = COPY[locale];

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="min-w-0">
              <div className="flex items-start gap-4">
                <OrgThumb name={task.org.name} slug={task.org.slug} size={72} className="h-[72px] w-[72px]" />
                <div>
                  <h1 className="text-[28px] font-semibold leading-tight text-ink">{task.title}</h1>
                  <p className="mt-1 text-[15px] font-medium text-ink">
                    <Link href={`/orgs/${task.org.slug}`} className="hover:text-forest hover:underline">
                      {task.org.name}
                    </Link>
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <HeadlineTag>{LOCATION_LABEL[task.location_kind]}</HeadlineTag>
                <SecondaryTag>{CATEGORY_LABEL[task.category]}</SecondaryTag>
                <DeviceTag category={task.category} />
                <SecondaryTag><Clock className="mr-1 size-3" />{formatHours(task.est_hours)}–{formatHours(task.max_hours)} {c.hrs}</SecondaryTag>
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
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-body"><Clock className="size-4 text-meta" /> {c.estimated}</dt>
                    <dd className="font-medium text-ink">{formatHours(task.est_hours)} {c.hours}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-body"><Gift className="size-4 text-meta" /> {c.hoursCap}</dt>
                    <dd className="font-medium text-ink">{formatHours(task.max_hours)} {c.hours}</dd>
                  </div>
                </dl>
                <p className="mt-3 rounded-md bg-section p-3 text-xs text-body">
                  {c.signInCallout}
                </p>
                <Button asChild className="mt-4 w-full">
                  <Link href="/start"><LogIn /> {c.signInToCommit}</Link>
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
