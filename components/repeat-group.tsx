"use client";

/**
 * RepeatGroup: a reusable primitive that renders a stack of cards (one per
 * iteration item) with collapsed/expanded state. Each card holds its own
 * sub-flow. When all cards report complete, the parent step is complete.
 *
 * Generic over the iteration item type. Slice 1's only consumer is the
 * food-audit basket capture, but the primitive is built so that future
 * audit-style tasks (pharmacy prices, gas prices, transit observations)
 * can plug in their own item shape and sub-flow.
 */

import { useState, type ReactNode } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";

export interface RepeatGroupItem {
  id: string;
  label: string;
  sublabel?: string;
  complete: boolean;
  summary?: string;
}

export function RepeatGroup({
  items,
  renderForm,
}: {
  items: RepeatGroupItem[];
  renderForm: (item: RepeatGroupItem, close: () => void) => ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(() => items.find((i) => !i.complete)?.id ?? null);

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <li
            key={item.id}
            className="rounded-lg border border-line bg-white overflow-hidden"
          >
            <button
              type="button"
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-section"
              onClick={() => setOpenId(open ? null : item.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={
                    item.complete
                      ? "shrink-0 h-6 w-6 rounded-full bg-forest text-white grid place-items-center"
                      : "shrink-0 h-6 w-6 rounded-full border border-line grid place-items-center text-muted"
                  }
                >
                  {item.complete ? <Check size={14} /> : <span className="text-xs">·</span>}
                </span>
                <div className="min-w-0">
                  <div className="font-medium text-ink truncate">{item.label}</div>
                  {item.summary ? (
                    <div className="text-sm text-muted truncate">{item.summary}</div>
                  ) : item.sublabel ? (
                    <div className="text-sm text-muted truncate">{item.sublabel}</div>
                  ) : null}
                </div>
              </div>
              {open ? <ChevronDown size={18} className="text-muted" /> : <ChevronRight size={18} className="text-muted" />}
            </button>
            {open ? (
              <div className="border-t border-line bg-section/30 px-4 py-4">
                {renderForm(item, () => setOpenId(null))}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
