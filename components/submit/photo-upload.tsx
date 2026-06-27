"use client";

import { useRef, useState } from "react";
import exifr from "exifr";
import { AlertCircle, ImagePlus, MapPin, X } from "lucide-react";
import { downscaleImageFile, MAX_FILE_COUNT } from "@/lib/images";

interface Pic {
  name: string;
  url: string;
  lat?: number;
  lng?: number;
  captured_at?: number;
}

export function PhotoUpload({
  name = "photos",
  min = 1,
  copy,
  error,
}: {
  name?: string;
  min?: number;
  copy?: { add: string; atLeast: string; noGeotag: string; addAtLeast: string };
  error?: string;
}) {
  const c = copy ?? {
    add: "Add photos",
    atLeast: "At least {n}. We read location from the photo when available.",
    noGeotag: "no geotag",
    addAtLeast: "Add at least {n} photos.",
  };
  const [pics, setPics] = useState<Pic[]>([]);
  const [meta, setMeta] = useState<string>("[]");
  const [tooMany, setTooMany] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    // Mirror the server-side count cap client-side: trim to MAX_FILE_COUNT and
    // tell the user, rather than letting the server reject the whole upload.
    setTooMany(picked.length > MAX_FILE_COUNT);
    const files = picked.slice(0, MAX_FILE_COUNT);
    const next: Pic[] = [];
    const metaArr: { lat?: number; lng?: number; captured_at?: number }[] = [];
    // Collect downscaled files so we can swap them back into the <input> below.
    // The form submits natively (action={submitWork}), so whatever lives on the
    // input element is what gets uploaded — replacing the FileList with the
    // re-encoded versions is what actually shrinks the payload to the Worker.
    const processed: File[] = [];
    for (const f of files) {
      let lat: number | undefined;
      let lng: number | undefined;
      let captured: number | undefined;
      try {
        // Read EXIF from the ORIGINAL file — canvas re-encoding strips it, so we
        // must pull geotag/timestamp before downscaling and pass them as
        // photo_meta (the server reads geo/captured_at from photo_meta, not the
        // uploaded bytes).
        const gps = await exifr.gps(f);
        if (gps) {
          lat = gps.latitude;
          lng = gps.longitude;
        }
        const parsed = await exifr.parse(f, { pick: ["DateTimeOriginal"] }).catch(() => null);
        if (parsed?.DateTimeOriginal) captured = new Date(parsed.DateTimeOriginal).getTime();
      } catch {
        /* no exif */
      }
      // Downscale 3–8 MB phone photos to a few hundred KB before upload. Falls
      // back to the original file if canvas/createImageBitmap is unavailable;
      // the server-side caps remain the authoritative guard either way.
      const small = await downscaleImageFile(f);
      processed.push(small);
      next.push({ name: f.name, url: URL.createObjectURL(small), lat, lng, captured_at: captured });
      metaArr.push({ lat, lng, captured_at: captured });
    }

    // Swap the downscaled files back onto the input so the native form submit
    // uploads the small versions, not the originals. DataTransfer is the only
    // standard way to set a FileList programmatically; guard for environments
    // (older browsers, JSDOM) where it's unavailable.
    if (inputRef.current && typeof DataTransfer !== "undefined") {
      try {
        const dt = new DataTransfer();
        for (const f of processed) dt.items.add(f);
        inputRef.current.files = dt.files;
      } catch {
        /* keep original FileList; server caps still bound the upload */
      }
    }

    setPics(next);
    setMeta(JSON.stringify(metaArr));
  }

  return (
    <div>
      {error && (
        <div className="mb-2 flex items-start gap-2 rounded-md border border-brick/40 bg-brick-subtle px-3 py-2 text-sm text-brick">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      <input type="hidden" name="photo_meta" value={meta} />
      <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-forest ${error ? "border-brick bg-brick-subtle hover:bg-brick-subtle/70" : "border-line bg-section hover:bg-forest-subtle"}`}>
        <ImagePlus className="size-6 text-meta" aria-hidden="true" />
        <span className="text-sm font-medium text-ink">{c.add}</span>
        <span className="text-xs text-meta">{c.atLeast.replace("{n}", String(min))}</span>
        <input ref={inputRef} type="file" name={name} accept="image/*" multiple className="sr-only" onChange={onChange} />
      </label>

      {pics.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {pics.map((p, i) => (
            <li key={i} className="overflow-hidden rounded-md border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.name} className="aspect-square w-full object-cover" />
              <div className="flex items-center gap-1 px-1.5 py-1 text-[11px] text-meta">
                <MapPin className="size-3" aria-hidden="true" />
                {p.lat != null ? `${p.lat.toFixed(3)}, ${p.lng?.toFixed(3)}` : c.noGeotag}
              </div>
            </li>
          ))}
        </ul>
      )}
      {pics.length > 0 && pics.length < min && (
        <p className="mt-2 flex items-center gap-1 text-xs text-amber"><X className="size-3" aria-hidden="true" /> {c.addAtLeast.replace("{n}", String(min))}</p>
      )}
      {tooMany && (
        <p className="mt-2 flex items-center gap-1 text-xs text-amber"><AlertCircle className="size-3" aria-hidden="true" /> Only the first {MAX_FILE_COUNT} photos were kept.</p>
      )}
    </div>
  );
}
