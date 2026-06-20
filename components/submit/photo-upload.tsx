"use client";

import { useState } from "react";
import exifr from "exifr";
import { ImagePlus, MapPin, X } from "lucide-react";

interface Pic {
  name: string;
  url: string;
  lat?: number;
  lng?: number;
  captured_at?: number;
}

export function PhotoUpload({ name = "photos", min = 1 }: { name?: string; min?: number }) {
  const [pics, setPics] = useState<Pic[]>([]);
  const [meta, setMeta] = useState<string>("[]");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const next: Pic[] = [];
    const metaArr: { lat?: number; lng?: number; captured_at?: number }[] = [];
    for (const f of files) {
      let lat: number | undefined;
      let lng: number | undefined;
      let captured: number | undefined;
      try {
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
      next.push({ name: f.name, url: URL.createObjectURL(f), lat, lng, captured_at: captured });
      metaArr.push({ lat, lng, captured_at: captured });
    }
    setPics(next);
    setMeta(JSON.stringify(metaArr));
  }

  return (
    <div>
      <input type="hidden" name="photo_meta" value={meta} />
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-section py-8 text-center hover:bg-forest-subtle">
        <ImagePlus className="size-6 text-meta" />
        <span className="text-sm font-medium text-ink">Add photos</span>
        <span className="text-xs text-meta">At least {min}. We read location from the photo when available.</span>
        <input type="file" name={name} accept="image/*" multiple className="sr-only" onChange={onChange} />
      </label>

      {pics.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {pics.map((p, i) => (
            <li key={i} className="overflow-hidden rounded-md border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.name} className="aspect-square w-full object-cover" />
              <div className="flex items-center gap-1 px-1.5 py-1 text-[11px] text-meta">
                <MapPin className="size-3" />
                {p.lat != null ? `${p.lat.toFixed(3)}, ${p.lng?.toFixed(3)}` : "no geotag"}
              </div>
            </li>
          ))}
        </ul>
      )}
      {pics.length > 0 && pics.length < min && (
        <p className="mt-2 flex items-center gap-1 text-xs text-amber"><X className="size-3" /> Add at least {min} photos.</p>
      )}
    </div>
  );
}
