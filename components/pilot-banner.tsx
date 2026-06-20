"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const DEFAULT_TEXT =
  "Pilot demo. Hours shown here are not yet recognized by SF HSA — we're working on it.";

export function PilotBanner({ text = DEFAULT_TEXT }: { text?: string }) {
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    setHidden(sessionStorage.getItem("tended_pilot_banner_dismissed") === "1");
  }, []);
  if (hidden) return null;
  return (
    <div className="relative flex h-12 items-center justify-center bg-section px-10 text-center text-sm text-body">
      <p>{text}</p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          sessionStorage.setItem("tended_pilot_banner_dismissed", "1");
          setHidden(true);
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-meta hover:bg-line/50"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
