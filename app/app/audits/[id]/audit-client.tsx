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

interface Props {
  audit: AuditRow;
  store: Store | null;
  captures: AuditItemCaptureRow[];
  basketItems: BasketItem[];
  storeTypes: { value: StoreType; label: string; help: string }[];
  ebtOptions: { value: EbtObservation; label: string }[];
}

export function AuditClient({ audit, store, captures, basketItems, storeTypes, ebtOptions }: Props) {
  const sessionSeconds = useSessionTimer(audit.id);
  const allCaptured = captures.length === basketItems.length;
  const canSubmit =
    !!audit.store_id && !!audit.store_type_observed && !!audit.ebt_observation && allCaptured;

  return (
    <div className="flex flex-col gap-8">
      <Step
        n={1}
        title="Confirm the store you're at"
        done={!!audit.store_id}
        summary={store ? `${store.name} · ${store.address}` : undefined}
      >
        <StoreStep auditId={audit.id} currentStoreId={audit.store_id} />
      </Step>

      <Step
        n={2}
        title="What kind of store is it?"
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
        title="Does the store accept EBT?"
        done={!!audit.ebt_observation}
        summary={
          audit.ebt_observation
            ? ebtOptions.find((e) => e.value === audit.ebt_observation)?.label
            : undefined
        }
      >
        <EbtStep auditId={audit.id} current={audit.ebt_observation} options={ebtOptions} />
      </Step>

      <Step n={4} title="Capture the 6 basket items" done={allCaptured} summary={`${captures.length} of ${basketItems.length} captured`}>
        <BasketStep auditId={audit.id} items={basketItems} captures={captures} />
      </Step>

      <SubmitStep auditId={audit.id} canSubmit={canSubmit} sessionSeconds={sessionSeconds} />
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
              : "shrink-0 h-7 w-7 rounded-full border border-line grid place-items-center text-sm font-medium text-muted"
          }
        >
          {done ? "✓" : n}
        </span>
        <div>
          <h2 className="font-semibold text-ink">{title}</h2>
          {summary ? <p className="text-sm text-muted mt-0.5">{summary}</p> : null}
        </div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

// ---------- Step 1: store ----------

function StoreStep({ auditId, currentStoreId }: { auditId: string; currentStoreId: string | null }) {
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
      <Label>Search a store by name or address</Label>
      <Input
        placeholder="e.g. Safeway 2020 Market"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading ? <p className="text-sm text-muted">Searching…</p> : null}
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
                <div className="text-sm text-muted">{s.address}</div>
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
        {showNew ? "Cancel" : "Store not listed — add it"}
      </button>

      {showNew ? <NewStoreForm auditId={auditId} /> : null}
    </div>
  );
}

function NewStoreForm({ auditId }: { auditId: string }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  function useDeviceLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Device location unavailable.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setGeoError(err.message || "Couldn't read location.")
    );
  }

  return (
    <form action={createStoreAction} className="rounded-md border border-line p-4 flex flex-col gap-3">
      <input type="hidden" name="audit_id" value={auditId} />
      <div>
        <Label htmlFor="store-name">Store name</Label>
        <Input id="store-name" name="name" required placeholder="Mi Tierra Market" />
      </div>
      <div>
        <Label htmlFor="store-address">Address</Label>
        <Input id="store-address" name="address" required placeholder="2840 J St, Sacramento, CA 95816" />
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={useDeviceLocation}>
          Use my current location
        </Button>
        {coords ? (
          <span className="text-sm text-muted">
            {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </span>
        ) : null}
        {geoError ? <span className="text-sm text-brick">{geoError}</span> : null}
      </div>
      <input type="hidden" name="lat" value={coords?.lat ?? ""} />
      <input type="hidden" name="lng" value={coords?.lng ?? ""} />
      <p className="text-xs text-muted">
        Location must be in California. We use it to validate the audit and prevent dup submissions.
      </p>
      <Button type="submit" disabled={!coords}>
        Add store
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
            {o.help ? <div className="text-sm text-muted">{o.help}</div> : null}
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
}: {
  auditId: string;
  items: BasketItem[];
  captures: AuditItemCaptureRow[];
}) {
  const byId = new Map(captures.map((c) => [c.basket_item_id, c]));
  const rgItems: RepeatGroupItem[] = items.map((item) => {
    const cap = byId.get(item.id);
    let summary: string | undefined;
    if (cap) {
      if (cap.stock_status === "in-stock" && cap.price_usd != null) {
        summary = `$${cap.price_usd.toFixed(2)} / ${cap.size_value} ${cap.size_unit}`;
      } else if (cap.stock_status === "out-of-stock") {
        summary = "Out of stock";
      } else if (cap.stock_status === "not-sold-at-this-store") {
        summary = "Not sold at this store";
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
        return <CaptureForm auditId={auditId} item={item} current={cap} onDone={close} />;
      }}
    />
  );
}

function CaptureForm({
  auditId,
  item,
  current,
  onDone,
}: {
  auditId: string;
  item: BasketItem;
  current?: AuditItemCaptureRow;
  onDone: () => void;
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
      setError(r.error ?? "Couldn't save.");
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
            {s === "in-stock" ? "In stock" : s === "out-of-stock" ? "Out of stock" : "Not sold here"}
          </button>
        ))}
      </div>

      {status === "in-stock" ? (
        <>
          <div>
            <Label htmlFor={`photo-${item.id}`}>Photo of the item + its shelf tag</Label>
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
              <Label htmlFor={`price-${item.id}`}>Shelf price (USD)</Label>
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
              <Label htmlFor={`size-${item.id}`}>Size</Label>
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
            <Label htmlFor={`unit-${item.id}`}>Unit</Label>
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
              <Label htmlFor={`mode-${item.id}`}>Priced by</Label>
              <select
                id={`mode-${item.id}`}
                name="produce_pricing_mode"
                required
                defaultValue={current?.produce_pricing_mode ?? "per-pound"}
                className="block w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
              >
                <option value="per-pound">Per pound</option>
                <option value="per-unit">Per unit</option>
              </select>
            </div>
          ) : null}
          <p className="text-xs text-muted">Expected: {item.spec}</p>
        </>
      ) : (
        <p className="text-sm text-muted">
          Marking this item as &quot;{status === "out-of-stock" ? "out of stock" : "not sold here"}&quot;.
          No photo needed.
        </p>
      )}

      {error ? <p className="text-sm text-brick">{error}</p> : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
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
}: {
  auditId: string;
  canSubmit: boolean;
  sessionSeconds: number;
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
          <h2 className="font-semibold text-ink">Submit audit</h2>
          <p className="text-sm text-muted">
            {Math.floor(sessionSeconds / 60)}m {sessionSeconds % 60}s of measured engagement so far.
          </p>
        </div>
        <Button type="submit" disabled={!canSubmit || submitting} size="lg">
          {submitting ? "Submitting…" : "Submit audit"}
        </Button>
      </div>
      {!canSubmit ? (
        <p className="text-sm text-muted">Finish all 4 steps above before submitting.</p>
      ) : null}
      {error ? <p className="text-sm text-brick">{error}</p> : null}
    </form>
  );
}
