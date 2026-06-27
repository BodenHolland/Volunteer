/**
 * Image upload bounds — shared between the client uploaders and the server
 * actions that persist photos to R2.
 *
 * Why this exists: phone cameras produce 3–8 MB JPEGs and a submission can
 * carry several of them. The Worker runtime is a 128 MB isolate, and each
 * uploaded file is (a) read fully into memory via `arrayBuffer()`, (b) stored
 * raw to R2, and (c) later base64-encoded for the AI validator (~+33%). A
 * handful of large photos in flight at once is a memory cliff.
 *
 * Strategy (chosen because Cloudflare Images is NOT provisioned, so we cannot
 * re-encode server-side, and no image library is installed in the Worker):
 *   1. Client-side downscale (canvas) shrinks photos to a few hundred KB before
 *      they ever hit the Worker — the highest-impact lever.
 *   2. These server-side caps are the authoritative backstop: even if the client
 *      downscale is bypassed/unavailable, the action rejects oversized or
 *      too-many files before reading them all into memory.
 *
 * Keep the numbers here in sync on both sides — the client imports the same
 * constants so its limits never drift from what the server enforces.
 */

/** Hard per-file ceiling, in bytes. 8 MB tolerates a high-res phone JPEG that
 * (for whatever reason) wasn't downscaled, while still bounding a single read. */
export const MAX_FILE_BYTES = 8 * 1024 * 1024;

/** Max number of photos accepted per submission/audit-item save. */
export const MAX_FILE_COUNT = 8;

/** Total bytes across all files in one request. Caps aggregate memory pressure
 * (count × per-file is the worst case; this is the real ceiling we care about). */
export const MAX_TOTAL_BYTES = 24 * 1024 * 1024;

/** Target max dimension (px) for the client downscale — long edge. */
export const DOWNSCALE_MAX_DIM = 1600;

/** JPEG quality for the client re-encode. */
export const DOWNSCALE_QUALITY = 0.8;

/** Megabytes, for human-facing copy. */
const MB = (bytes: number) => Math.round(bytes / (1024 * 1024));

export type ImageValidationResult = { ok: true } | { ok: false; error: string };

/**
 * Authoritative server-side validation of an uploaded image set.
 *
 * Pass the `File[]` (or any array of `{ size }`) BEFORE calling
 * `arrayBuffer()` on any of them — `File.size` is available without reading the
 * body, so we can reject early and avoid pulling oversized payloads into the
 * isolate. Returns a user-facing error string on failure (caller decides
 * whether to `redirect(?error=…)` or return `{ ok, error }`).
 */
export function validateImageUploads(
  files: ReadonlyArray<{ size: number }>,
  opts?: { maxCount?: number; maxFileBytes?: number; maxTotalBytes?: number }
): ImageValidationResult {
  const maxCount = opts?.maxCount ?? MAX_FILE_COUNT;
  const maxFileBytes = opts?.maxFileBytes ?? MAX_FILE_BYTES;
  const maxTotalBytes = opts?.maxTotalBytes ?? MAX_TOTAL_BYTES;

  if (files.length > maxCount) {
    return {
      ok: false,
      error: `Too many photos — attach at most ${maxCount}. You added ${files.length}.`,
    };
  }

  let total = 0;
  for (const f of files) {
    if (f.size > maxFileBytes) {
      return {
        ok: false,
        error: `One photo is too large (over ${MB(maxFileBytes)} MB). Retake it or pick a smaller image.`,
      };
    }
    total += f.size;
  }

  if (total > maxTotalBytes) {
    return {
      ok: false,
      error: `Those photos total too much (over ${MB(maxTotalBytes)} MB). Remove a few and try again.`,
    };
  }

  return { ok: true };
}

/**
 * Downscale + re-encode a single image File in the browser via canvas, so a
 * 3–8 MB phone JPEG becomes a few hundred KB before upload.
 *
 * Graceful fallbacks: if the file isn't a raster image, or the browser lacks
 * `createImageBitmap`/canvas/`toBlob`, or anything throws, the ORIGINAL file is
 * returned unchanged. The server-side caps in `validateImageUploads` remain the
 * authoritative guard, so a fallthrough never produces an unbounded upload —
 * it just means that one file relies on the server cap instead.
 *
 * Browser-only: depends on DOM/Canvas APIs. Never import into server code.
 */
export async function downscaleImageFile(
  file: File,
  opts?: { maxDim?: number; quality?: number }
): Promise<File> {
  const maxDim = opts?.maxDim ?? DOWNSCALE_MAX_DIM;
  const quality = opts?.quality ?? DOWNSCALE_QUALITY;

  // Only attempt for raster images; leave PDFs/HEIC-without-decode/etc. alone.
  if (!file.type.startsWith("image/")) return file;
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const longEdge = Math.max(width, height);

    // Already small enough AND already a JPEG → no point re-encoding.
    if (longEdge <= maxDim && file.type === "image/jpeg") {
      bitmap.close();
      return file;
    }

    const scale = longEdge > maxDim ? maxDim / longEdge : 1;
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob || blob.size === 0) return file;

    // If re-encoding didn't actually save anything, keep the original.
    if (blob.size >= file.size && file.type === "image/jpeg") return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    // createImageBitmap can throw on unsupported formats (e.g. some HEIC) —
    // fall back to the original; the server cap still bounds it.
    return file;
  }
}
