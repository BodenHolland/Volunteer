"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

/** Visual-only save toggle (no persistence in the demo). */
export function BookmarkButton({ initial = false, label }: { initial?: boolean; label?: string }) {
  const [saved, setSaved] = useState(initial);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={label ? `Save ${label}` : "Save"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSaved((v) => !v);
      }}
      className="flex size-8 items-center justify-center rounded-full bg-section text-meta hover:text-forest"
    >
      <Bookmark className={cn("size-[18px]", saved && "fill-forest text-forest")} />
    </button>
  );
}
