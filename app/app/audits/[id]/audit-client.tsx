"use client";

import { useEffect, useRef, useState } from "react";
import exifr from "exifr";
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
} from "@/lib/food-audit";
import {
  captureItemAction,
  createStoreAction,
  selectStoreAction,
  searchStoresAction,
  setEbtAction,
  setStoreTypeAction,
  submitAuditAction,
} from "./audit-actions";

export interface AuditCopy {
  step1Title: string;
  step2Title: string;
  step3Title: string;
  step4Title: string;
  capturedSummary: string;
  searchLabel: string;
  searchPlaceholder: string;
  searching: string;
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
  submitting: string;
  submitBtn: string;
  finishSteps: string;
}

interface Props {
  audit: AuditRow;
  store: Store | null;
  captures: AuditItemCaptureRow[];
  basketItems: BasketItem[];
  storeTypes: { value: StoreType; label: string; help: string }[];
  ebtOptions: { value: EbtObservation; label: string }[];
  copy: AuditCopy;
}

export function AuditClient({ audit, store, captures, basketItems, storeTypes, ebtOptions, copy }: Props) {
  const sessionSeconds = useSessionTimer(audit.id);
  const allCaptured = captures.length === basketItems.length;
  const canSubmit =
    !!audit.store_id && !!audit.store_type_observed && !!audit.ebt_observation && allCaptured;

  return (
    <div className="flex flex-col gap-8">
      <Step
        n={1}
        title={copy.step1Title}
        done={!!audit.store_id}
        summary={store ? `${store.name} · ${store.address}` : undefined}
      >
        <StoreStep auditId={audit.id} currentStoreId={audit.store_id} copy={copy} />
      </Step>

      <Step
        n={2}
        title={copy.step2Title}
        done={!!audit.store_type_observed}
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
        summary={
          audit.ebt_observation
            ? ebtOptions.find((e) => e.value === audit.ebt_observation)?.label
            : undefined
        }
      >
        <EbtStep auditId={audit.id} current={audit.ebt_observation} options={ebtOptions} />
      </Step>

      <Step n={4} title={copy.step4Title} done={allCaptured} summary={copy.capturedSummary.replace("{n}", String(captures.length)).replace("{total}", String(basketItems.length))}>
        <BasketStep auditId={audit.id} items={basketItems} captures={captures} copy={copy} />
      </Step>

      <SubmitStep auditId={audit.id} canSubmit={canSubmit} sessionSeconds={sessionSeconds} copy={copy} />
    </div>
  );
}

// ---------- Session timer (measured active engagement) ----------

function useSessionTimer(auditId: string) {
  const [seconds, setSeconds] = useState(0);
  const lastInteractionRef = useRef(Date.now());

  useEffect(() => {
    const bump = () => {
      lastInteractionRef.current = Date.now();
    };
    const events = ["pointerdown", "keydown", "scroll", "input", "touchstart"];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    let lastTick = Date.now();
    const tick = setInterval(() => {
      const now = Date.now();
      const visible = document.visibilityState === "visible";
      const idleMs = now - lastInteractionRef.current;
      const sinceLast = (now - lastTick) / 1000;
      lastTick = now;
      if (visible && idleMs < 60_000) {
        setSeconds((s) => s + sinceLast);
      }
    }, 1000);
    return () => {
      clearInterval(tick);
      events.forEach((e) => window.removeEventListener(e, bump));
    };
  }, [auditId]);

  return Math.floor(seconds);
}

// ---------- Step shell ----------

function Step({
  n,
  title,
  done,
  summary,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  summary?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-white">
      <header className="flex items-start gap-3 px-5 py-4 border-b border-line">
        <span
          className={
            done
              ? "shrink-0 h-7 w-7 rounded-full bg-forest text-white grid place-items-center text-sm font-medium"
              : "shrink-0 h-7 w-7 rounded-full border border-line grid place-items-center text-sm font-medium text-body"
          }
        >
          {done ? "✓" : n}
        </span>
        <div>
          <h2 className="font-semibold text-ink">{title}</h2>
          {summary ? <p className="text-sm text-body mt-0.5">{summary}</p> : null}
        </div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

// ---------- Step 1: store ----------

function StoreStep({ auditId, currentStoreId, copy }: { auditId: string; currentStoreId: string | null; copy: AuditCopy }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Store[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await searchStoresAction(query);
      if (!cancelled) {
        setResults(r);
        setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  return (
    <div className="flex flex-col gap-3">
      <Label>{copy.searchLabel}</Label>
      <Input
        placeholder={copy.searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading ? <p className="text-sm text-body">{copy.searching}</p> : null}
      <ul className="flex flex-col gap-1">
        {results.map((s) => (
          <li key={s.id}>
            <form action={selectStoreAction}>
              <input type="hidden" name="audit_id" value={auditId} />
              <input type="hidden" name="store_id" value={s.id} />
              <button
                type="submit"
                className={
                  s.id === currentStoreId
                    ? "w-full text-left rounded-md border border-forest bg-forest-subtle px-3 py-2"
                    : "w-full text-left rounded-md border border-line hover:bg-section px-3 py-2"
                }
              >
                <div className="font-medium text-ink">{s.name}</div>
                <div className="text-sm text-body">{s.address}</div>
              </button>
            </form>
          </li>
        ))}
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
      }
    }
    const r = await captureItemAction(fd);
    setSubmitting(false);
    if (!r.ok) {
      setError(r.error ?? copy.couldntSave);
      return;
    }
    onDone();
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
          <div>
            <Label htmlFor={`photo-${item.id}`}>{copy.photoLabel}</Label>
            <Input
              id={`photo-${item.id}`}
              name="photo"
              type="file"
              accept="image/*"
              capture="environment"
              required
            />
          </div>
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
        <Button type="submit" disabled={submitting}>
          {submitting ? copy.saving : copy.save}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          {copy.cancel}
        </Button>
      </div>
    </form>
  );
}

// ---------- Submit ----------

function SubmitStep({
  auditId,
  canSubmit,
  sessionSeconds,
  copy,
}: {
  auditId: string;
  canSubmit: boolean;
  sessionSeconds: number;
  copy: AuditCopy;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData();
    fd.set("audit_id", auditId);
    fd.set("session_seconds", String(sessionSeconds));
    const result = await submitAuditAction(fd);
    setSubmitting(false);
    if (result && !result.ok && result.error) setError(result.error);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-line bg-white p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-ink">{copy.submitTitle}</h2>
          <p className="text-sm text-body">
            {copy.measuredEngagement.replace("{m}", String(Math.floor(sessionSeconds / 60))).replace("{s}", String(sessionSeconds % 60))}
          </p>
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
  );
}
