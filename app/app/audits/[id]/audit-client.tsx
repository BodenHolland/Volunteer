"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import exifr from "exifr";
import { Camera, Check, Loader2, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RepeatGroup, type RepeatGroupItem } from "@/components/repeat-group";
import type {
  AuditRow,
  AuditItemCaptureRow,
  BasketItem,
  EbtObservation,
  Store,
  StockStatus,
  StoreType,
  TravelMode,
} from "@/lib/food-audit";
/* Store is still used by Props from the server component, but the search list now
 * deals in NearbyStore so DB hits and Nominatim hits can share one render path. */
import type { NearbyStore } from "@/lib/places";
import { downscaleImageFile } from "@/lib/images";
import {
  captureItemAction,
  createStoreAction,
  nearbyStoresAction,
  selectNearbyStoreAction,
  selectStoreAction,
  searchStoresAction,
  setCommuteModeAction,
  setCommuteUserMinutesAction,
  setEbtAction,
  setStoreTypeAction,
  submitAuditAction,
} from "./audit-actions";

function formatDistance(meters: number, away: string): string {
  const miles = meters / 1609.34;
  const value = miles < 0.1 ? "<0.1" : miles.toFixed(1);
  return `${value} mi ${away}`;
}

export interface AuditCopy {
  step1Title: string;
  step2Title: string;
  step3Title: string;
  step4Title: string;
  capturedSummary: string;
  searchLabel: string;
  searchPlaceholder: string;
  searching: string;
  useLocationCta: string;
  locating: string;
  nearbyTitle: string;
  nearbyNone: string;
  searchOr: string;
  away: string;
  cancel: string;
  addStore: string;
  storeName: string;
  storeNamePlaceholder: string;
  address: string;
  addressPlaceholder: string;
  useLocation: string;
  locationUnavailable: string;
  locationError: string;
  locationNote: string;
  addStoreBtn: string;
  inStock: string;
  outOfStock: string;
  notSoldHere: string;
  notSoldAtStore: string;
  photoLabel: string;
  takePhoto: string;
  retake: string;
  photoHint: string;
  photoReady: string;
  shelfPrice: string;
  size: string;
  unit: string;
  pricedBy: string;
  perPound: string;
  perUnit: string;
  expected: string;
  markingOos: string;
  markingNotSold: string;
  couldntSave: string;
  saving: string;
  save: string;
  submitTitle: string;
  measuredEngagement: string;
  commuteAppend: string;
  noCommute: string;
  submitting: string;
  submitBtn: string;
  finishSteps: string;
  edit: string;
  commuteTitle: string;
  commuteHint: string;
  commuteRoundTrip: string;
  commuteUnknown: string;
  commuteUnknownCta: string;
  customCommuteTitle: string;
  customCommuteHint: string;
  customCommuteClear: string;
  cancelTask: string;
  cancelConfirm: string;
  cancelYes: string;
  cancelNo: string;
}

export interface CreditPreview {
  itemsDocumented: number;
  oneWayCommuteSeconds: number | null;
  creditedHours: number;
  modeEstimates: Record<TravelMode, number> | null;
  userMinutes: number | null;
}

interface Props {
  audit: AuditRow;
  store: Store | null;
  captures: AuditItemCaptureRow[];
  basketItems: BasketItem[];
  storeTypes: { value: StoreType; label: string; help: string }[];
  ebtOptions: { value: EbtObservation; label: string }[];
  travelModes: { value: TravelMode; label: string }[];
  copy: AuditCopy;
  creditPreview: CreditPreview;
}

export function AuditClient({ audit, store, captures, basketItems, storeTypes, ebtOptions, travelModes, copy, creditPreview }: Props) {
  const allCaptured = captures.length === basketItems.length;
  const canSubmit =
    !!audit.store_id && !!audit.store_type_observed && !!audit.ebt_observation && allCaptured;

  return (
    <div className="flex flex-col gap-8">

      <Step
        n={1}
        title={copy.step1Title}
        done={!!audit.store_id}
        editLabel={copy.edit}
        summary={store ? `${store.name} · ${store.address}` : undefined}
      >
        <StoreStep auditId={audit.id} currentStoreId={audit.store_id} copy={copy} />
      </Step>

      {audit.store_id ? (
        <CommutePanel
          auditId={audit.id}
          currentMode={audit.commute_mode ?? null}
          options={travelModes}
          oneWayCommuteSeconds={creditPreview.oneWayCommuteSeconds}
          modeEstimates={creditPreview.modeEstimates}
          userMinutes={creditPreview.userMinutes}
          copy={copy}
        />
      ) : null}

      <Step
        n={2}
        title={copy.step2Title}
        done={!!audit.store_type_observed}
        editLabel={copy.edit}
        summary={
          audit.store_type_observed
            ? storeTypes.find((t) => t.value === audit.store_type_observed)?.label
            : undefined
        }
      >
        <StoreTypeStep auditId={audit.id} current={audit.store_type_observed} options={storeTypes} />
      </Step>

      <Step
        n={3}
        title={copy.step3Title}
        done={!!audit.ebt_observation}
        editLabel={copy.edit}
        summary={
          audit.ebt_observation
            ? ebtOptions.find((e) => e.value === audit.ebt_observation)?.label
            : undefined
        }
      >
        <EbtStep auditId={audit.id} current={audit.ebt_observation} options={ebtOptions} />
      </Step>

      <Step n={4} title={copy.step4Title} done={allCaptured} editLabel={copy.edit} summary={copy.capturedSummary.replace("{n}", String(captures.length)).replace("{total}", String(basketItems.length))}>
        <BasketStep auditId={audit.id} items={basketItems} captures={captures} copy={copy} />
      </Step>

      <SubmitStep
        auditId={audit.id}
        canSubmit={canSubmit}
        copy={copy}
        creditPreview={creditPreview}
      />
    </div>
  );
}

// ---------- Commute (how the volunteer got to the store) ----------

function CommutePanel({
  auditId,
  currentMode,
  options,
  oneWayCommuteSeconds,
  modeEstimates,
  userMinutes,
  copy,
}: {
  auditId: string;
  currentMode: TravelMode | null;
  options: { value: TravelMode; label: string }[];
  oneWayCommuteSeconds: number | null;
  modeEstimates: Record<TravelMode, number> | null;
  userMinutes: number | null;
  copy: AuditCopy;
}) {
  const mode = currentMode ?? "drive";
  const roundTripMin =
    oneWayCommuteSeconds == null ? null : Math.round((oneWayCommuteSeconds * 2) / 60);

  // Per-mode round-trip minutes (for the picker labels and the override cap).
  const modeRoundTripMin = modeEstimates
    ? {
        drive: Math.round((modeEstimates.drive * 2) / 60),
        transit: Math.round((modeEstimates.transit * 2) / 60),
      }
    : null;
  const capMinutes = modeRoundTripMin
    ? Math.max(modeRoundTripMin.drive, modeRoundTripMin.transit)
    : null;

  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="font-semibold text-ink">{copy.commuteTitle}</h2>
      <p className="mt-1 text-sm text-body">{copy.commuteHint}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => {
          const mins = modeRoundTripMin?.[o.value];
          return (
            <form key={o.value} action={setCommuteModeAction}>
              <input type="hidden" name="audit_id" value={auditId} />
              <input type="hidden" name="commute_mode" value={o.value} />
              <button
                type="submit"
                className={
                  o.value === mode
                    ? "rounded-md border border-forest bg-forest-subtle px-3 py-2 text-sm font-medium text-ink"
                    : "rounded-md border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-section"
                }
              >
                {o.label}
                {mins != null ? <span className="ml-1.5 text-xs text-meta">~{mins} min</span> : null}
              </button>
            </form>
          );
        })}
      </div>
      {roundTripMin == null ? (
        <p className="mt-3 text-sm text-body">
          {copy.commuteUnknown}{" "}
          <a href="/app/profile" className="font-medium text-forest hover:underline">
            {copy.commuteUnknownCta}
          </a>
        </p>
      ) : (
        <p className="mt-3 text-sm text-body">
          {copy.commuteRoundTrip.replace("{m}", String(roundTripMin))}
        </p>
      )}
      {capMinutes != null ? (
        <CustomCommute auditId={auditId} userMinutes={userMinutes} capMinutes={capMinutes} copy={copy} />
      ) : null}
    </section>
  );
}

function CustomCommute({
  auditId,
  userMinutes,
  capMinutes,
  copy,
}: {
  auditId: string;
  userMinutes: number | null;
  capMinutes: number;
  copy: AuditCopy;
}) {
  const [value, setValue] = useState<string>(userMinutes == null ? "" : String(userMinutes));
  // Keep input in sync if the server-side value changes (e.g., after a save).
  useEffect(() => {
    setValue(userMinutes == null ? "" : String(userMinutes));
  }, [userMinutes]);

  return (
    <details className="mt-4 border-t border-line pt-3 text-sm">
      <summary className="cursor-pointer font-medium text-ink">{copy.customCommuteTitle}</summary>
      <p className="mt-2 text-xs text-meta">
        {copy.customCommuteHint.replace("{cap}", String(capMinutes))}
      </p>
      <form action={setCommuteUserMinutesAction} className="mt-3 flex items-center gap-2">
        <input type="hidden" name="audit_id" value={auditId} />
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={capMinutes}
          step={1}
          name="minutes"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`0 – ${capMinutes}`}
          className="w-28 rounded-md border border-line px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          className="rounded-md border border-forest bg-forest-subtle px-3 py-1.5 text-sm font-medium text-forest hover:bg-forest hover:text-white"
        >
          {copy.save}
        </button>
        {userMinutes != null ? (
          <button
            type="submit"
            name="minutes"
            value=""
            formAction={setCommuteUserMinutesAction}
            className="text-xs font-medium text-meta hover:text-ink"
          >
            {copy.customCommuteClear}
          </button>
        ) : null}
      </form>
    </details>
  );
}

// ---------- Step shell ----------

function Step({
  n,
  title,
  done,
  summary,
  editLabel,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  summary?: string;
  editLabel: string;
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  // Collapse automatically once the step is done, and again whenever the
  // selection changes (summary updates) after the user re-opens it to edit.
  useEffect(() => {
    setEditing(false);
  }, [done, summary]);
  const open = !done || editing;

  return (
    <section className="rounded-xl border border-line bg-white">
      <header className="flex items-center gap-3 px-5 py-4">
        <span
          className={
            done
              ? "shrink-0 h-7 w-7 rounded-full bg-forest text-white grid place-items-center text-sm font-medium"
              : "shrink-0 h-7 w-7 rounded-full border border-line grid place-items-center text-sm font-medium text-body"
          }
        >
          {done ? "✓" : n}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-ink">{title}</h2>
          {summary && !open ? <p className="mt-0.5 truncate text-sm text-body">{summary}</p> : null}
        </div>
        {done && !open ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 text-sm font-medium text-teal hover:underline"
          >
            {editLabel}
          </button>
        ) : null}
      </header>
      {open ? <div className="border-t border-line p-5">{children}</div> : null}
    </section>
  );
}

// ---------- Step 1: store ----------

function StoreStep({ auditId, currentStoreId, copy }: { auditId: string; currentStoreId: string | null; copy: AuditCopy }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NearbyStore[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  // Nearby-by-location state.
  const [locating, setLocating] = useState(false);
  const [nearby, setNearby] = useState<NearbyStore[] | null>(null);
  const [hint, setHint] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [picking, startPick] = useTransition();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    // Debounce 350ms — Nominatim's policy is ≤1 req/sec, and the longer pause
    // also avoids firing on every keystroke mid-word.
    const t = setTimeout(async () => {
      const r = await searchStoresAction(query, hint);
      if (!cancelled) {
        setResults(r);
        setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, hint]);

  function useMyLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError(copy.locationUnavailable);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setHint({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        try {
          const list = await nearbyStoresAction(pos.coords.latitude, pos.coords.longitude);
          setNearby(list);
        } catch {
          setGeoError(copy.locationError);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setGeoError(err.message || copy.locationError);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  function pick(store: NearbyStore) {
    startPick(async () => {
      const fd = new FormData();
      fd.set("audit_id", auditId);
      if (store.source === "db" && store.store_id) {
        fd.set("store_id", store.store_id);
        await selectStoreAction(fd);
      } else {
        fd.set("name", store.name);
        fd.set("address", store.address);
        fd.set("lat", String(store.lat));
        fd.set("lng", String(store.lng));
        fd.set("place_id", store.place_id ?? "");
        await selectNearbyStoreAction(fd);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        className="self-start"
        onClick={useMyLocation}
        disabled={locating}
      >
        {locating ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
        {locating ? copy.locating : copy.useLocationCta}
      </Button>
      {geoError ? <p className="text-sm text-brick">{geoError}</p> : null}

      {nearby ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-ink">{copy.nearbyTitle}</p>
          {nearby.length === 0 ? (
            <p className="text-sm text-body">{copy.nearbyNone}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {nearby.map((s) => {
                const isCurrent = s.source === "db" && s.store_id === currentStoreId;
                return (
                  <li key={s.place_id ?? s.store_id ?? `${s.lat},${s.lng}`}>
                    <button
                      type="button"
                      onClick={() => pick(s)}
                      disabled={picking}
                      className={
                        isCurrent
                          ? "flex w-full items-center gap-3 rounded-md border border-forest bg-forest-subtle px-3 py-2 text-left disabled:opacity-60"
                          : "flex w-full items-center gap-3 rounded-md border border-line px-3 py-2 text-left hover:bg-section disabled:opacity-60"
                      }
                    >
                      <MapPin className="size-4 shrink-0 text-forest" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-ink">{s.name}</span>
                        <span className="block truncate text-sm text-body">{s.address}</span>
                      </span>
                      <span className="shrink-0 text-xs text-meta">
                        {formatDistance(s.distance_m, copy.away)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      <div className="border-t border-line pt-3">
        <Label>{nearby ? copy.searchOr : copy.searchLabel}</Label>
        <Input
          className="mt-1"
          placeholder={copy.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {loading ? <p className="text-sm text-body">{copy.searching}</p> : null}
      <ul className="flex flex-col gap-1">
        {results.map((s) => {
          const isCurrent = s.source === "db" && s.store_id === currentStoreId;
          return (
            <li key={s.place_id ?? s.store_id ?? `${s.lat},${s.lng}`}>
              <button
                type="button"
                onClick={() => pick(s)}
                disabled={picking}
                className={
                  isCurrent
                    ? "flex w-full items-center gap-3 rounded-md border border-forest bg-forest-subtle px-3 py-2 text-left disabled:opacity-60"
                    : "flex w-full items-center gap-3 rounded-md border border-line px-3 py-2 text-left hover:bg-section disabled:opacity-60"
                }
              >
                <MapPin className="size-4 shrink-0 text-forest" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">{s.name}</span>
                  <span className="block truncate text-sm text-body">{s.address}</span>
                </span>
                {hint ? (
                  <span className="shrink-0 text-xs text-meta">
                    {formatDistance(s.distance_m, copy.away)}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="text-sm text-forest underline-offset-2 hover:underline self-start"
        onClick={() => setShowNew((x) => !x)}
      >
        {showNew ? copy.cancel : copy.addStore}
      </button>

      {showNew ? <NewStoreForm auditId={auditId} copy={copy} /> : null}
    </div>
  );
}

function NewStoreForm({ auditId, copy }: { auditId: string; copy: AuditCopy }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  function useDeviceLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError(copy.locationUnavailable);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setGeoError(err.message || copy.locationError)
    );
  }

  return (
    <form action={createStoreAction} className="rounded-md border border-line p-4 flex flex-col gap-3">
      <input type="hidden" name="audit_id" value={auditId} />
      <div>
        <Label htmlFor="store-name">{copy.storeName}</Label>
        <Input id="store-name" name="name" required placeholder={copy.storeNamePlaceholder} />
      </div>
      <div>
        <Label htmlFor="store-address">{copy.address}</Label>
        <Input id="store-address" name="address" required placeholder={copy.addressPlaceholder} />
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={useDeviceLocation}>
          {copy.useLocation}
        </Button>
        {coords ? (
          <span className="text-sm text-body">
            {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </span>
        ) : null}
        {geoError ? <span className="text-sm text-brick">{geoError}</span> : null}
      </div>
      <input type="hidden" name="lat" value={coords?.lat ?? ""} />
      <input type="hidden" name="lng" value={coords?.lng ?? ""} />
      <p className="text-xs text-body">{copy.locationNote}</p>
      <Button type="submit" disabled={!coords}>
        {copy.addStoreBtn}
      </Button>
    </form>
  );
}

// ---------- Step 2: store type ----------

function StoreTypeStep({
  auditId,
  current,
  options,
}: {
  auditId: string;
  current: StoreType | null;
  options: { value: StoreType; label: string; help: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => (
        <form key={o.value} action={setStoreTypeAction}>
          <input type="hidden" name="audit_id" value={auditId} />
          <input type="hidden" name="store_type" value={o.value} />
          <button
            type="submit"
            className={
              o.value === current
                ? "w-full text-left rounded-md border border-forest bg-forest-subtle px-3 py-2"
                : "w-full text-left rounded-md border border-line hover:bg-section px-3 py-2"
            }
          >
            <div className="font-medium text-ink">{o.label}</div>
            {o.help ? <div className="text-sm text-body">{o.help}</div> : null}
          </button>
        </form>
      ))}
    </div>
  );
}

// ---------- Step 3: EBT ----------

function EbtStep({
  auditId,
  current,
  options,
}: {
  auditId: string;
  current: EbtObservation | null;
  options: { value: EbtObservation; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => (
        <form key={o.value} action={setEbtAction}>
          <input type="hidden" name="audit_id" value={auditId} />
          <input type="hidden" name="ebt" value={o.value} />
          <button
            type="submit"
            className={
              o.value === current
                ? "w-full text-left rounded-md border border-forest bg-forest-subtle px-3 py-2"
                : "w-full text-left rounded-md border border-line hover:bg-section px-3 py-2"
            }
          >
            {o.label}
          </button>
        </form>
      ))}
    </div>
  );
}

// ---------- Step 4: basket items (RepeatGroup) ----------

function BasketStep({
  auditId,
  items,
  captures,
  copy,
}: {
  auditId: string;
  items: BasketItem[];
  captures: AuditItemCaptureRow[];
  copy: AuditCopy;
}) {
  const byId = new Map(captures.map((c) => [c.basket_item_id, c]));
  const rgItems: RepeatGroupItem[] = items.map((item) => {
    const cap = byId.get(item.id);
    let summary: string | undefined;
    if (cap) {
      if (cap.stock_status === "in-stock" && cap.price_usd != null) {
        summary = `$${cap.price_usd.toFixed(2)} / ${cap.size_value} ${cap.size_unit}`;
      } else if (cap.stock_status === "out-of-stock") {
        summary = copy.outOfStock;
      } else if (cap.stock_status === "not-sold-at-this-store") {
        summary = copy.notSoldAtStore;
      }
    }
    return {
      id: item.id,
      label: item.display_name,
      sublabel: item.spec,
      complete: !!cap,
      summary,
    };
  });

  return (
    <RepeatGroup
      items={rgItems}
      renderForm={(rgItem, close) => {
        const item = items.find((i) => i.id === rgItem.id)!;
        const cap = byId.get(item.id);
        return <CaptureForm auditId={auditId} item={item} current={cap} onDone={close} copy={copy} />;
      }}
    />
  );
}

function CaptureForm({
  auditId,
  item,
  current,
  onDone,
  copy,
}: {
  auditId: string;
  item: BasketItem;
  current?: AuditItemCaptureRow;
  onDone: () => void;
  copy: AuditCopy;
}) {
  const [status, setStatus] = useState<StockStatus>(current?.stock_status ?? "in-stock");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    fd.set("stock_status", status);
    if (status === "in-stock") {
      const photo = fd.get("photo");
      if (photo instanceof File && photo.size > 0) {
        try {
          const gps = await exifr.gps(photo).catch(() => null);
          if (gps?.latitude != null && gps?.longitude != null) {
            fd.set("exif_lat", String(gps.latitude));
            fd.set("exif_lng", String(gps.longitude));
          }
          const parsed = await exifr.parse(photo, { pick: ["DateTimeOriginal"] }).catch(() => null);
          if (parsed?.DateTimeOriginal) {
            fd.set("exif_ts", String(new Date(parsed.DateTimeOriginal).getTime()));
          }
        } catch {
          /* no exif — pipeline will skip the geotag check */
        }
        // Downscale before upload to keep phone photos off the 128MB Worker
        // memory ceiling. EXIF was already read above from the original, since
        // the canvas re-encode strips it.
        const small = await downscaleImageFile(photo);
        if (small !== photo) fd.set("photo", small);
      }
      // Device GPS at capture time — a proof-of-presence signal that works even
      // when the photo carries no EXIF location. Best-effort: skipped silently
      // if geolocation is unavailable or the user declines.
      const pos = await new Promise<GeolocationPosition | null>((resolve) => {
        if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (p) => resolve(p),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 7000, maximumAge: 60_000 }
        );
      });
      if (pos) {
        fd.set("device_lat", String(pos.coords.latitude));
        fd.set("device_lng", String(pos.coords.longitude));
      }
    }
    // A thrown server action (e.g. body-size rejection, network drop) would
    // skip setSubmitting(false) and leave the button stuck on "Saving…" —
    // catch it so the user sees an error and can retry.
    try {
      const r = await captureItemAction(fd);
      if (!r.ok) {
        setError(r.error ?? copy.couldntSave);
        return;
      }
      onDone();
    } catch {
      setError(copy.couldntSave);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" encType="multipart/form-data">
      <input type="hidden" name="audit_id" value={auditId} />
      <input type="hidden" name="basket_item_id" value={item.id} />

      <div className="flex gap-2">
        {(["in-stock", "out-of-stock", "not-sold-at-this-store"] as StockStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={
              s === status
                ? "rounded-md border border-forest bg-forest-subtle px-3 py-1.5 text-sm"
                : "rounded-md border border-line hover:bg-section px-3 py-1.5 text-sm"
            }
          >
            {s === "in-stock" ? copy.inStock : s === "out-of-stock" ? copy.outOfStock : copy.notSoldHere}
          </button>
        ))}
      </div>

      {status === "in-stock" ? (
        <>
          <PhotoCapture item={item} copy={copy} onHasPhoto={setHasPhoto} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`price-${item.id}`}>{copy.shelfPrice}</Label>
              <Input
                id={`price-${item.id}`}
                name="price_usd"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                defaultValue={current?.price_usd ?? ""}
                required
              />
            </div>
            <div>
              <Label htmlFor={`size-${item.id}`}>{copy.size}</Label>
              <Input
                id={`size-${item.id}`}
                name="size_value"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                defaultValue={current?.size_value ?? ""}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor={`unit-${item.id}`}>{copy.unit}</Label>
            <select
              id={`unit-${item.id}`}
              name="size_unit"
              required
              defaultValue={current?.size_unit ?? item.unit_options[0]}
              className="block w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
            >
              {item.unit_options.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          {item.category === "produce" ? (
            <div>
              <Label htmlFor={`mode-${item.id}`}>{copy.pricedBy}</Label>
              <select
                id={`mode-${item.id}`}
                name="produce_pricing_mode"
                required
                defaultValue={current?.produce_pricing_mode ?? "per-pound"}
                className="block w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
              >
                <option value="per-pound">{copy.perPound}</option>
                <option value="per-unit">{copy.perUnit}</option>
              </select>
            </div>
          ) : null}
          <p className="text-xs text-body">{copy.expected} {item.spec}</p>
        </>
      ) : (
        <p className="text-sm text-body">
          {status === "out-of-stock" ? copy.markingOos : copy.markingNotSold}
        </p>
      )}

      {error ? <p className="text-sm text-brick">{error}</p> : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting || (status === "in-stock" && !hasPhoto)}>
          {submitting ? copy.saving : copy.save}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          {copy.cancel}
        </Button>
      </div>
    </form>
  );
}

/**
 * Camera-only photo capture. `capture="environment"` opens the rear camera on
 * mobile; a fresh, EXIF-timestamped photo is far stronger audit evidence than
 * an uploaded library file, so we intentionally don't offer a file picker. The
 * file stays inside the form (name="photo") and is uploaded to R2 on save.
 */
function PhotoCapture({
  item,
  copy,
  onHasPhoto,
}: {
  item: BasketItem;
  copy: AuditCopy;
  onHasPhoto: (has: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (f) {
      setPreviewUrl(URL.createObjectURL(f));
      setFileName(f.name);
      onHasPhoto(true);
    } else {
      setPreviewUrl(null);
      setFileName(null);
      onHasPhoto(false);
    }
  }

  return (
    <div>
      <Label htmlFor={`photo-${item.id}`}>{copy.photoLabel}</Label>
      <input
        ref={inputRef}
        id={`photo-${item.id}`}
        name="photo"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onChange}
        className="sr-only"
      />
      {previewUrl ? (
        <div className="mt-1 flex items-center gap-3 rounded-md border border-line p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="" className="size-16 shrink-0 rounded object-cover" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-sm font-medium text-forest">
              <Check className="size-4" aria-hidden /> {copy.photoReady}
            </p>
            {fileName ? <p className="truncate text-xs text-meta">{fileName}</p> : null}
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
            <RefreshCw className="size-4" /> {copy.retake}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-1 flex w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-line bg-section/50 px-4 py-6 text-center hover:bg-section"
        >
          <Camera className="size-6 text-forest" aria-hidden />
          <span className="text-sm font-medium text-ink">{copy.takePhoto}</span>
          <span className="text-xs text-body">{copy.photoHint}</span>
        </button>
      )}
    </div>
  );
}

// ---------- Submit ----------

function SubmitStep({
  auditId,
  canSubmit,
  copy,
  creditPreview,
}: {
  auditId: string;
  canSubmit: boolean;
  copy: AuditCopy;
  creditPreview: CreditPreview;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData();
    fd.set("audit_id", auditId);
    // Session timer was removed — credit is items × 5 min + commute, both capped.
    fd.set("session_seconds", "0");
    const result = await submitAuditAction(fd);
    setSubmitting(false);
    if (result && !result.ok && result.error) setError(result.error);
  }

  const commuteMinutes =
    creditPreview.oneWayCommuteSeconds == null
      ? null
      : Math.round((creditPreview.oneWayCommuteSeconds * 2) / 60);
  const commuteFragment =
    commuteMinutes == null
      ? copy.noCommute
      : copy.commuteAppend.replace("{m}", String(commuteMinutes));
  const creditLine = copy.measuredEngagement
    .replace("{h}", creditPreview.creditedHours.toFixed(2))
    .replace("{n}", String(creditPreview.itemsDocumented))
    .replace("{commute}", commuteFragment);

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-line bg-white p-5 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-ink">{copy.submitTitle}</h2>
            <p className="text-sm text-body">{creditLine}</p>
          </div>
          <Button type="submit" disabled={!canSubmit || submitting} size="lg">
            {submitting ? copy.submitting : copy.submitBtn}
          </Button>
        </div>
        {!canSubmit ? (
          <p className="text-sm text-body">{copy.finishSteps}</p>
        ) : null}
        {error ? <p className="text-sm text-brick">{error}</p> : null}
      </form>
    </div>
  );
}
