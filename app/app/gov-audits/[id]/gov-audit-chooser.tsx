"use client";

import { useState } from "react";
import { MapPin, Shuffle, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  pickLocalSite,
  pickRandomSite,
  sitesForViewer,
  type GovSite,
} from "@/lib/gov-sites";

/**
 * Pre-anchor chooser: lets the volunteer pick what to audit instead of being
 * sent to hunt for a specific page. Three paths:
 *
 *   1. "My local government", sites scoped to the viewer's city/state, with
 *      the single best local match preselected (their city, else state portal).
 *   2. "Random government page", one pull from the full registry; reroll on
 *      demand. Encourages broad coverage of the catalog.
 *   3. "Enter your own", any US gov / nonprofit / public-service URL.
 *
 * The picked URL is handed back to the parent, which kicks the live embed to it.
 */
export function GovAuditChooser({
  viewerCity,
  viewerState,
  initialUrl,
  onPick,
}: {
  viewerCity: string | null;
  viewerState: string | null;
  initialUrl: string;
  onPick: (url: string) => void;
}) {
  const localSites = sitesForViewer(viewerCity, viewerState);
  const preferredLocal = pickLocalSite(viewerCity, viewerState);
  const [tab, setTab] = useState<"local" | "random" | "custom">("local");
  const [localChoiceId, setLocalChoiceId] = useState<string>(preferredLocal.id);
  const [randomSite, setRandomSite] = useState<GovSite>(() => pickRandomSite());
  const [customUrl, setCustomUrl] = useState<string>(initialUrl);
  const [customError, setCustomError] = useState<string | null>(null);

  const localChoice = localSites.find((s) => s.id === localChoiceId) ?? preferredLocal;
  const cityLabel = viewerCity ? toTitle(viewerCity) : null;
  const stateLabel = viewerState ? viewerState.toUpperCase() : null;
  const placeLabel = cityLabel && stateLabel ? `${cityLabel}, ${stateLabel}` : cityLabel ?? stateLabel ?? "your area";

  function loadCustom() {
    const url = customUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      setCustomError("Enter a full URL starting with https://");
      return;
    }
    setCustomError(null);
    onPick(url);
  }

  return (
    <section className="rounded-lg border border-line bg-white p-4">
      <h2 className="text-base font-semibold text-ink">Pick what to audit</h2>
      <p className="mt-1 text-sm text-body">
        Audit a US government, nonprofit, or public-service website, any one. Your findings join the free public
        dataset.
      </p>

      <div className="mt-3 flex flex-wrap gap-2 border-b border-line">
        <TabBtn active={tab === "local"} onClick={() => setTab("local")}>
          <MapPin className="size-4" /> My local government
        </TabBtn>
        <TabBtn active={tab === "random"} onClick={() => setTab("random")}>
          <Shuffle className="size-4" /> Random
        </TabBtn>
        <TabBtn active={tab === "custom"} onClick={() => setTab("custom")}>
          <LinkIcon className="size-4" /> Enter your own
        </TabBtn>
      </div>

      {tab === "local" && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-body">
            Sites near {placeLabel}. Pick one and we&apos;ll load it below.
          </p>
          <select
            value={localChoice.id}
            onChange={(e) => setLocalChoiceId(e.target.value)}
            className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
          >
            {localSites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}, {s.description}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs text-body">{localChoice.url}</span>
            <Button type="button" onClick={() => onPick(localChoice.url)}>
              Audit this site
            </Button>
          </div>
        </div>
      )}

      {tab === "random" && (
        <div className="mt-4 space-y-3">
          <div className="rounded-md border border-line bg-section px-3 py-2.5">
            <p className="text-sm font-medium text-ink">{randomSite.name}</p>
            <p className="mt-0.5 text-xs text-body">{randomSite.description}</p>
            <p className="mt-1 truncate text-xs text-body">{randomSite.url}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" onClick={() => onPick(randomSite.url)}>
              Audit this site
            </Button>
            <Button type="button" variant="secondary" onClick={() => setRandomSite(pickRandomSite())}>
              <Shuffle className="size-4" /> Reroll
            </Button>
          </div>
        </div>
      )}

      {tab === "custom" && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-body">
            Any US government, nonprofit, or public-service URL works. Examples: a city department page, a state
            agency, a public library&apos;s benefits guide.
          </p>
          <div className="flex gap-2">
            <Input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://www.example.gov/…"
              className="flex-1"
              spellCheck={false}
            />
            <Button type="button" onClick={loadCustom}>
              Audit this site
            </Button>
          </div>
          {customError && <p className="text-sm text-brick">{customError}</p>}
        </div>
      )}
    </section>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        active ? "border-navy text-ink" : "border-transparent text-body hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function toTitle(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
