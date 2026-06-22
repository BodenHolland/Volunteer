/**
 * Field-level encryption for sensitive PII (legal name, case number, DOB,
 * address, phone). AES-256-GCM via Web Crypto.
 *
 * Requires `PII_ENCRYPTION_KEY` (32-byte base64). In production, encrypting with
 * no key configured throws (fail-closed) so PII is never written in cleartext;
 * only in DEMO_MODE does it fall back to passthrough. `decryptField` is tolerant —
 * it returns plaintext as-is, so legacy/sample rows and a later key rollout both
 * read correctly.
 *
 * Format: `enc:v1:<ivBase64>:<ciphertextBase64>`.
 */
import { getEnv, isDemoMode } from "./cf";

const PREFIX = "enc:v1:";

function b64encode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buf as ArrayBuffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64decode(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getKey(): Promise<CryptoKey | null> {
  let raw: string | undefined;
  try {
    raw = (getEnv() as unknown as { PII_ENCRYPTION_KEY?: string }).PII_ENCRYPTION_KEY;
  } catch {
    raw = undefined;
  }
  if (!raw) return null;
  const keyBytes = b64decode(raw);
  if (keyBytes.length !== 32) return null;
  return crypto.subtle.importKey("raw", keyBytes as BufferSource, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptField(plaintext: string | null | undefined): Promise<string | null> {
  if (plaintext == null || plaintext === "") return plaintext ?? null;
  if (plaintext.startsWith(PREFIX)) return plaintext; // already encrypted
  const key = await getKey();
  if (!key) {
    if (isDemoMode()) return plaintext; // local/dev: no key configured → passthrough
    throw new Error("PII_ENCRYPTION_KEY is required to store PII.");
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(plaintext);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, enc as BufferSource);
  return `${PREFIX}${b64encode(iv)}:${b64encode(ct)}`;
}

export async function decryptField(value: string | null | undefined): Promise<string | null> {
  if (value == null || value === "") return value ?? null;
  if (!value.startsWith(PREFIX)) return value; // plaintext (seed/legacy) → as-is
  const key = await getKey();
  if (!key) return value; // can't decrypt without key; surface raw token
  try {
    const [, , ivB64, ctB64] = value.split(":");
    const iv = b64decode(ivB64);
    const ct = b64decode(ctB64);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, ct as BufferSource);
    return new TextDecoder().decode(pt);
  } catch {
    return value;
  }
}

/** Encrypt/decrypt a JSON-serializable object (e.g. address_json). */
export async function encryptJson(value: unknown): Promise<string | null> {
  if (value == null) return null;
  return encryptField(typeof value === "string" ? value : JSON.stringify(value));
}
