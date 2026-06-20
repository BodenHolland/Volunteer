"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChecklistItem } from "@/lib/types";

interface Row {
  label: string;
  required: boolean;
}

function slug(label: string, index: number): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return base || `item-${index + 1}`;
}

/**
 * Edits an array of checklist rows. Serializes to a hidden input named
 * "checklist_json" as a JSON array of { id, label, required }.
 */
export function ChecklistEditor({ initial }: { initial?: ChecklistItem[] }) {
  const [rows, setRows] = useState<Row[]>(
    initial && initial.length > 0
      ? initial.map((r) => ({ label: r.label, required: r.required }))
      : [{ label: "", required: true }]
  );

  const update = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const add = () => setRows((rs) => [...rs, { label: "", required: false }]);
  const remove = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const serialized: ChecklistItem[] = rows
    .map((r, i) => ({ id: slug(r.label, i), label: r.label.trim(), required: r.required }))
    .filter((r) => r.label.length > 0)
    // de-dupe ids by appending an index when collisions occur
    .map((r, i, arr) => {
      const firstIdx = arr.findIndex((x) => x.id === r.id);
      return firstIdx === i ? r : { ...r, id: `${r.id}-${i}` };
    });

  return (
    <div className="space-y-2">
      <input type="hidden" name="checklist_json" value={JSON.stringify(serialized)} />
      <ul className="space-y-2">
        {rows.map((row, i) => (
          <li key={i} className="flex items-center gap-2 rounded-md border border-line bg-white p-2">
            <GripVertical className="size-4 shrink-0 text-meta" aria-hidden />
            <Input
              value={row.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="e.g. Photograph at least 3 trees"
              className="flex-1"
              aria-label={`Checklist item ${i + 1}`}
            />
            <button
              type="button"
              onClick={() => update(i, { required: !row.required })}
              className={cn(
                "inline-flex h-9 shrink-0 items-center rounded-md border px-3 text-xs font-medium",
                row.required
                  ? "border-forest bg-forest-subtle text-forest"
                  : "border-line bg-white text-meta hover:bg-section"
              )}
              aria-pressed={row.required}
            >
              {row.required ? "Required" : "Optional"}
            </button>
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={rows.length === 1}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-meta hover:bg-section disabled:opacity-40"
              aria-label={`Remove item ${i + 1}`}
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="secondary" size="sm" onClick={add}>
        <Plus /> Add item
      </Button>
    </div>
  );
}
