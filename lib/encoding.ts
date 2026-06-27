// Shared binary→text encoding helpers.

/**
 * ArrayBuffer → base64, chunked to stay under the argument-count limit of
 * String.fromCharCode for large buffers.
 */
export function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}
