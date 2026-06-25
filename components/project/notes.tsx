"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { saveNotes } from "@/app/app/project-actions";

export function Notes({
  submissionId,
  initial,
  locked,
  copy,
}: {
  submissionId: string;
  initial: string;
  locked?: boolean;
  copy?: { placeholder: string; saving: string; saved: string; autosaves: string };
}) {
  const c = copy ?? {
    placeholder: "Jot notes as you work, what you found, where you are, anything to remember.",
    saving: "Saving…",
    saved: "Saved",
    autosaves: "Autosaves when you click away.",
  };
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const persist = () => {
    if (locked || value === initial) return;
    const fd = new FormData();
    fd.set("submission_id", submissionId);
    fd.set("notes", value);
    start(async () => {
      await saveNotes(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  };

  return (
    <div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={persist}
        disabled={locked}
        placeholder={c.placeholder}
      />
      <p className="mt-1 h-4 text-xs text-meta" aria-live="polite">
        {pending ? c.saving : saved ? <span className="inline-flex items-center gap-1 text-forest"><Check className="size-3" /> {c.saved}</span> : c.autosaves}
      </p>
    </div>
  );
}
