"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toggleChecklist } from "@/app/app/project-actions";
import { cn } from "@/lib/utils";
import type { ChecklistItem, ChecklistProgress } from "@/lib/types";

export function Checklist({
  submissionId,
  items,
  progress,
  locked,
  copy,
}: {
  submissionId: string;
  items: ChecklistItem[];
  progress: ChecklistProgress;
  locked?: boolean;
  copy?: { required: string; optional: string };
}) {
  const c = copy ?? { required: "required", optional: "optional" };
  const [state, setState] = useState<ChecklistProgress>(progress);
  const [, start] = useTransition();

  const toggle = (id: string) => {
    if (locked) return;
    const next = !state[id];
    setState((s) => ({ ...s, [id]: next }));
    const fd = new FormData();
    fd.set("submission_id", submissionId);
    fd.set("item_id", id);
    fd.set("checked", next ? "1" : "0");
    start(() => toggleChecklist(fd));
  };

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const checked = !!state[item.id];
        return (
          <li key={item.id}>
            <button
              type="button"
              disabled={locked}
              onClick={() => toggle(item.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-md border border-line p-3 text-left transition-colors",
                checked ? "bg-forest-subtle" : "bg-white hover:bg-section",
                locked && "cursor-default opacity-90"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border",
                  checked ? "border-forest bg-forest text-white" : "border-line bg-white"
                )}
              >
                {checked && <Check className="size-3.5" />}
              </span>
              <span className={cn("text-sm", checked ? "text-ink" : "text-body")}>
                {item.label}
                {item.required ? (
                  <span className="ml-1.5 text-xs text-meta">{c.required}</span>
                ) : (
                  <span className="ml-1.5 text-xs text-meta">{c.optional}</span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
