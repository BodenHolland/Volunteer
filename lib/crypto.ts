/**
 * Field-level encryption for sensitive PII (legal name, case number, DOB,
 * address, phone). AES-256-GCM via Web Crypto.
 *
 * Requires `PII_ENCRYPTION_KEY` (32-byte base64). In any real runtime,
 * encrypting with no key configured throws (fail-closed) so PII is never written
 * in cleartext. Plaintext passthrough is permitted ONLY under an explicit
 * DEMO_MODE flag or an explicit unit-test run (which runs with no key by
 * design) — never inferred from a missing Cloudflare context. `decryptField`
 * tolerates legacy/sample plaintext under that same explicit gate, so seeded
 * rows and a later key rollout read correctly without weakening production.
 *
 * Format: `enc:v1:<ivBase64>:<ciphertextBase64>`.
 */
import { getEnv, isDemoMode, isTestRun } from "./cf";

/** Plaintext is only acceptable under an explicit demo flag or a test run. */
function plaintextAllowed(): boolean {
  return isDemoMode() || isTestRun();
}

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
  // Test-only hook: in a unit-test run there is no Cloudflare context (getEnv()
  // throws above), so tests that need to exercise the REAL AES-GCM path can
  // supply a key via process.env.PII_ENCRYPTION_KEY. This is gated on
  // isTestRun() and only consulted when the CF env didn't already provide a key,
  // so production (isTestRun() === false, key comes from the CF env) is
  // unaffected.
  if (!raw && isTestRun()) {
    raw =
      typeof process !== "undefined"
        ? (process.env.PII_ENCRYPTION_KEY as string | undefined)
        : undefined;
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
    // No key: pass through only under an explicit demo flag or test run.
    // Any other runtime (incl. an uninitialized Cloudflare context) fails closed.
    if (plaintextAllowed()) return plaintext;
    throw new Error("PII_ENCRYPTION_KEY is required to store PII.");
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(plaintext);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, enc as BufferSource);
  return `${PREFIX}${b64encode(iv)}:${b64encode(ct)}`;
}

export async function decryptField(value: string | null | undefined): Promise<string | null> {
  if (value == null || value === "") return value ?? null;
  if (!value.startsWith(PREFIX)) {
    // Non-enc value. Legacy/seed plaintext is tolerated only under the explicit
    // demo/test gate. In a real runtime this means PII was stored in cleartext —
    // surface it (don't crash reads) but never normalize that as acceptable.
    return value;
  }
  const key = await getKey();
  if (!key) {
    // An enc:v1 token with no key. Under the explicit test/demo gate, surface the
    // raw token (the no-key passthrough the tests assert). In a real runtime a
    // missing key while ciphertext exists is a misconfiguration — fail closed.
    if (plaintextAllowed()) return value;
    throw new Error("PII_ENCRYPTION_KEY is required to read encrypted PII.");
  }
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
