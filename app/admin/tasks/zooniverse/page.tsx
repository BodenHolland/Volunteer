import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/cf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addZooniverseCatalogEntry, toggleZooniverseCatalogActive } from "./actions";
import { ORG_CITIZEN_SCIENCE } from "@/lib/zooniverse";
import type { ExternalProjectCatalog, TaskTemplate } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Zooniverse catalog — colift admin" };

interface CatalogRow extends ExternalProjectCatalog {
  title: string;
  status: string;
  monthly_minutes_cap: number | null;
  gate_external_beneficiary: number;
  gate_genuine_need: number;
  gate_free_deliverable: number;
  gate_would_do_anyway: number;
}

export default async function ZooniverseCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const rows =
    (await getDb()
      .prepare(
        `SELECT c.*, t.title, t.status, t.monthly_minutes_cap,
                t.gate_external_beneficiary, t.gate_genuine_need,
                t.gate_free_deliverable, t.gate_would_do_anyway
           FROM external_project_catalog c
           JOIN task_templates t ON t.id = c.task_template_id
          WHERE c.provider = 'zooniverse'
          ORDER BY c.created_at DESC`
      )
      .all<CatalogRow>()).results ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link
          href="/admin/tasks"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline"
        >
          <ArrowLeft className="size-4" /> Task approval
        </Link>
        <h1 className="text-[28px] font-semibold text-ink">Zooniverse catalog</h1>
        <p className="mt-1 text-body">
          Projects volunteers can complete on Zooniverse for verified citizen-science hours. Each entry must
          pass the 4-part beneficiary gate before going active.
        </p>
      </div>

      {sp.error && (
        <p className="rounded-md border border-brick/30 bg-brick-subtle p-3 text-sm text-brick">{sp.error}</p>
      )}
      {sp.ok && (
        <p className="rounded-md border border-forest/30 bg-teal-subtle p-3 text-sm text-forest">{sp.ok}</p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Active catalog</h2>
        {rows.length === 0 ? (
          <p className="rounded-lg border border-line bg-section p-5 text-sm text-meta">
            No Zooniverse projects in the catalog yet. Add one below.
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => {
              const gateOk =
                !!r.gate_external_beneficiary &&
                !!r.gate_genuine_need &&
                !!r.gate_free_deliverable &&
                !!r.gate_would_do_anyway;
              return (
                <li key={r.task_template_id} className="rounded-lg border border-line bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{r.title}</p>
                      <p className="mt-1 text-xs text-meta">
                        {r.external_project_slug} · cap {Math.round((r.monthly_minutes_cap ?? 600) / 60)}h/mo
                      </p>
                      <p className="mt-1 text-xs text-meta">
                        4-part gate: {gateOk ? "✓ all four attested" : "✗ incomplete — task cannot go active"}
                      </p>
                      <a
                        href={r.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-forest hover:underline"
                      >
                        <ExternalLink className="size-3" /> Open on Zooniverse
                      </a>
                    </div>
                    <form action={toggleZooniverseCatalogActive}>
                      <input type="hidden" name="task_template_id" value={r.task_template_id} />
                      <input type="hidden" name="next_active" value={r.active ? "0" : "1"} />
                      <Button type="submit" variant="secondary" className="text-xs">
                        {r.active ? "Deactivate" : "Activate"}
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-4 rounded-lg border border-line bg-white p-6">
        <h2 className="text-lg font-semibold text-ink">Add a Zooniverse project</h2>
        <p className="text-sm text-body">
          Creates a new task template under <em>colift Citizen Science</em> ({ORG_CITIZEN_SCIENCE}) with the
          provider metadata you enter here. You must attest the 4-part beneficiary gate; the task goes active
          only when all four boxes are checked.
        </p>
        <form action={addZooniverseCatalogEntry} className="space-y-4">
          <div>
            <Label htmlFor="title" className="mb-1.5">Task title</Label>
            <Input id="title" name="title" required placeholder="Classify wildlife images for X" />
          </div>
          <div>
            <Label htmlFor="short_description" className="mb-1.5">Short description</Label>
            <Textarea id="short_description" name="short_description" required rows={2} maxLength={500} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="external_project_id" className="mb-1.5">Zooniverse project id</Label>
              <Input id="external_project_id" name="external_project_id" required placeholder="5115" />
            </div>
            <div>
              <Label htmlFor="external_project_slug" className="mb-1.5">Project slug</Label>
              <Input
                id="external_project_slug"
                name="external_project_slug"
                required
                placeholder="zooniverse/snapshot-serengeti"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="project_url" className="mb-1.5">Project URL</Label>
            <Input
              id="project_url"
              name="project_url"
              type="url"
              required
              placeholder="https://www.zooniverse.org/projects/zooniverse/snapshot-serengeti"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="task_type_label" className="mb-1.5">Task type</Label>
              <Input id="task_type_label" name="task_type_label" required placeholder="Image classification" />
            </div>
            <div>
              <Label htmlFor="monthly_minutes_cap" className="mb-1.5">Monthly minutes cap</Label>
              <Input
                id="monthly_minutes_cap"
                name="monthly_minutes_cap"
                type="number"
                min="0"
                step="30"
                defaultValue={600}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="public_benefit_summary" className="mb-1.5">Public-benefit summary</Label>
            <Textarea
              id="public_benefit_summary"
              name="public_benefit_summary"
              required
              rows={2}
              maxLength={500}
              placeholder="One or two sentences on who benefits from this work and how the output is published."
            />
          </div>

          <div className="space-y-2 rounded-md border border-amber/30 bg-amber-subtle p-4">
            <p className="text-sm font-medium text-ink">4-part beneficiary gate</p>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="gate_external_beneficiary" /> External beneficiary
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="gate_genuine_need" /> Genuine need
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="gate_free_deliverable" /> Free public deliverable
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="gate_would_do_anyway" /> Would-do-anyway
            </label>
            <p className="text-xs text-meta">
              All four must be checked for the task to go active. Otherwise it&apos;s created as draft.
            </p>
          </div>

          <Button type="submit" className="w-full">Add to catalog</Button>
        </form>
      </section>
    </div>
  );
}
