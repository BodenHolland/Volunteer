import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChecklistEditor } from "@/components/org/checklist-editor";
import type { ChecklistItem, DeliverableSpec, TaskTemplate } from "@/lib/types";

const CATEGORIES: { value: TaskTemplate["category"]; label: string }[] = [
  { value: "data-collection", label: "Data collection" },
  { value: "translation", label: "Translation" },
  { value: "civic-input", label: "Civic input" },
  { value: "neighborhood-writing", label: "Neighborhood writing" },
  { value: "seminar", label: "Seminar" },
];

const selectClass =
  "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 disabled:opacity-50";

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-meta">{hint}</p>}
    </div>
  );
}

export function TaskForm({
  action,
  task,
  submitLabel,
  hiddenFields,
}: {
  action: (formData: FormData) => void | Promise<void>;
  task?: TaskTemplate;
  submitLabel: string;
  hiddenFields?: Record<string, string>;
}) {
  const checklist: ChecklistItem[] = task
    ? safeParse<ChecklistItem[]>(task.checklist_json, [])
    : [];
  const spec: Partial<DeliverableSpec> = task
    ? safeParse<DeliverableSpec>(task.deliverable_spec_json, {} as DeliverableSpec)
    : {};

  return (
    <form action={action} className="space-y-8">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}

      {/* Basics */}
      <section className="space-y-4 rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Basics</h2>
        <Field label="Title" htmlFor="title">
          <Input id="title" name="title" required defaultValue={task?.title ?? ""} placeholder="e.g. Census your block's street trees" />
        </Field>
        <Field label="Category" htmlFor="category">
          <select id="category" name="category" required defaultValue={task?.category ?? "data-collection"} className={selectClass}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Short description" htmlFor="short_description" hint="One or two sentences shown in the task catalog.">
          <Textarea id="short_description" name="short_description" required defaultValue={task?.short_description ?? ""} placeholder="What will the volunteer do, in a sentence?" />
        </Field>
        <Field label="Instructions" htmlFor="instructions_md" hint="Markdown supported. Walk the volunteer through the steps.">
          <Textarea id="instructions_md" name="instructions_md" required defaultValue={task?.instructions_md ?? ""} className="min-h-[160px]" placeholder={"## What you'll do\n1. ..."} />
        </Field>
      </section>

      {/* Checklist */}
      <section className="space-y-3 rounded-lg border border-line bg-white p-5">
        <div>
          <h2 className="text-lg font-semibold text-ink">Checklist</h2>
          <p className="text-sm text-body">The steps a volunteer ticks off as they work. Required items gate submission.</p>
        </div>
        <ChecklistEditor initial={checklist} />
      </section>

      {/* Deliverables */}
      <section className="space-y-4 rounded-lg border border-line bg-white p-5">
        <div>
          <h2 className="text-lg font-semibold text-ink">Deliverables</h2>
          <p className="text-sm text-body">What proof of work the submission must include. Leave blank if not applicable.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Minimum photos" htmlFor="min_photos">
            <Input id="min_photos" name="min_photos" type="number" min="0" step="1" defaultValue={spec.min_photos ?? ""} placeholder="e.g. 3" />
          </Field>
          <Field label="Minimum words" htmlFor="min_words">
            <Input id="min_words" name="min_words" type="number" min="0" step="1" defaultValue={spec.min_words ?? ""} placeholder="e.g. 250" />
          </Field>
        </div>
        <label className="flex items-center gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            name="require_geotag"
            value="1"
            defaultChecked={!!spec.require_geotag}
            className="size-4 rounded border-line text-forest focus-visible:ring-2 focus-visible:ring-forest"
          />
          Require geotagged photos (location must match the task area)
        </label>
      </section>

      {/* Logistics */}
      <section className="space-y-4 rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Logistics</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Estimated hours" htmlFor="est_hours">
            <Input id="est_hours" name="est_hours" type="number" min="0" step="0.5" required defaultValue={task?.est_hours ?? ""} placeholder="e.g. 3" />
          </Field>
          <Field label="Maximum hours" htmlFor="max_hours" hint="Cap on creditable hours.">
            <Input id="max_hours" name="max_hours" type="number" min="0" step="0.5" required defaultValue={task?.max_hours ?? ""} placeholder="e.g. 5" />
          </Field>
          <Field label="Location" htmlFor="location_kind">
            <select id="location_kind" name="location_kind" required defaultValue={task?.location_kind ?? "online"} className={selectClass}>
              <option value="online">Online</option>
              <option value="in_person">In person</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </Field>
        </div>
        <Field label="Validation rubric" htmlFor="validation_rubric_md" hint="How a reviewer (and the AI assistant) should judge a complete submission.">
          <Textarea id="validation_rubric_md" name="validation_rubric_md" defaultValue={task?.validation_rubric_md ?? ""} className="min-h-[120px]" placeholder="A complete submission includes…" />
        </Field>
      </section>

      {/* Publish */}
      <section className="space-y-4 rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Status</h2>
        <Field label="Visibility" htmlFor="status" hint="Drafts stay private. Active tasks appear in the public catalog.">
          <select id="status" name="status" required defaultValue={task?.status === "active" ? "active" : "draft"} className={selectClass}>
            <option value="draft">Draft — not visible to volunteers</option>
            <option value="active">Active — open for volunteers</option>
          </select>
        </Field>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit">{submitLabel}</Button>
        <Button asChild variant="tertiary">
          <Link href="/org/tasks">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

function safeParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
