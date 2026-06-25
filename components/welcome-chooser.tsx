"use client";

import { useState } from "react";
import { FileCheck, HandHeart, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pickIntent } from "@/app/get-started/actions";

type OptionKey = "casual_volunteer" | "snap_cert" | "org_member";

const OPTIONS: {
  key: OptionKey;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  title: string;
  body: string;
}[] = [
  {
    key: "casual_volunteer",
    icon: HandHeart,
    title: "Volunteer on civic work",
    body: "I want to help out on real tasks that local nonprofits and public agencies actually need.",
  },
  {
    key: "snap_cert",
    icon: FileCheck,
    title: "Get my SNAP work-hours certified",
    body: "I receive SNAP and want my volunteer hours counted toward my monthly work requirement.",
  },
  {
    key: "org_member",
    icon: ClipboardCheck,
    title: "Review work for my organization",
    body: "I represent a nonprofit or public agency and want to post tasks or certify volunteer hours.",
  },
];

interface WelcomeChooserProps {
  option0Title?: string; option0Body?: string;
  option1Title?: string; option1Body?: string;
  option2Title?: string; option2Body?: string;
  nextBtn?: string;
}

export function WelcomeChooser({ option0Title, option0Body, option1Title, option1Body, option2Title, option2Body, nextBtn }: WelcomeChooserProps = {}) {
  const [selected, setSelected] = useState<OptionKey | null>(null);

  const labels = [
    { title: option0Title ?? OPTIONS[0].title, body: option0Body ?? OPTIONS[0].body },
    { title: option1Title ?? OPTIONS[1].title, body: option1Body ?? OPTIONS[1].body },
    { title: option2Title ?? OPTIONS[2].title, body: option2Body ?? OPTIONS[2].body },
  ];

  return (
    <form action={pickIntent} className="space-y-3">
      <input type="hidden" name="choice" value={selected ?? ""} />
      {OPTIONS.map(({ key, icon: Icon }, i) => {
        const { title, body } = labels[i];
        const active = selected === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setSelected(key)}
            aria-pressed={active}
            className={[
              "flex w-full items-start gap-4 rounded-lg border p-4 text-left transition",
              active
                ? "border-forest bg-forest-subtle ring-1 ring-forest"
                : "border-line bg-white hover:bg-section",
            ].join(" ")}
          >
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[4px] border border-line bg-white">
              {active && <span className="size-3 rounded-[2px] bg-forest" aria-hidden />}
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-semibold text-ink">{title}</span>
              <span className="mt-1 block text-sm text-body">{body}</span>
            </span>
            <Icon className="size-7 shrink-0 text-forest" strokeWidth={1.5} aria-hidden />
          </button>
        );
      })}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={!selected}>{nextBtn ?? "Next"}</Button>
      </div>
    </form>
  );
}
