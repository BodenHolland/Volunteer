import { test } from "node:test";
import assert from "node:assert";
import { webcrypto } from "node:crypto";
import { encryptField, decryptField, encryptJson } from "@/lib/crypto";

/** A real 32-byte AES-256 key, base64-encoded (what PII_ENCRYPTION_KEY holds). */
function freshKeyB64(): string {
  return Buffer.from(webcrypto.getRandomValues(new Uint8Array(32))).toString("base64");
}

/**
 * Run `fn` with a real PII_ENCRYPTION_KEY in process.env, then restore. The
 * crypto module's test-only hook (gated on isTestRun()) reads this key, so these
 * tests exercise the genuine AES-GCM path — not the no-key passthrough the other
 * tests in this file cover. The key is removed afterward so the passthrough
 * tests keep seeing "no key".
 */
async function withKey<T>(b64: string | undefined, fn: () => Promise<T>): Promise<T> {
  const prev = process.env.PII_ENCRYPTION_KEY;
  if (b64 === undefined) delete process.env.PII_ENCRYPTION_KEY;
  else process.env.PII_ENCRYPTION_KEY = b64;
  try {
    return await fn();
  } finally {
    if (prev === undefined) delete process.env.PII_ENCRYPTION_KEY;
    else process.env.PII_ENCRYPTION_KEY = prev;
  }
}

/**
 * In a plain tsx test there is no Cloudflare context, so getEnv() throws inside
 * getKey(); getKey() catches and returns null → the no-key passthrough path.
 * These assertions verify that passthrough behavior holds.
 */

test("encryptField: plaintext is returned unchanged when no key", async () => {
  assert.equal(await encryptField("Marisol Reyes"), "Marisol Reyes");
  assert.equal(await encryptField("123 Alabama St"), "123 Alabama St");
});

test("encryptField: null / undefined return null; empty string passes through", async () => {
  assert.equal(await encryptField(null), null);
  assert.equal(await encryptField(undefined), null);
  // `"" ?? null` is "" — empty string is preserved, not coerced to null.
  assert.equal(await encryptField(""), "");
});

test("encryptField: an already-encrypted token is returned as-is", async () => {
  const token = "enc:v1:aXY=:Y3Q=";
  assert.equal(await encryptField(token), token);
});

test("decryptField: non-enc input is returned unchanged (plaintext tolerance)", async () => {
  assert.equal(await decryptField("plain legal name"), "plain legal name");
  assert.equal(await decryptField("12345"), "12345");
});

test("decryptField: null / undefined return null; empty string passes through", async () => {
  assert.equal(await decryptField(null), null);
  assert.equal(await decryptField(undefined), null);
  assert.equal(await decryptField(""), "");
});

test("decryptField: with no key, an enc:v1 token surfaces raw (cannot decrypt)", async () => {
  const token = "enc:v1:aXY=:Y3Q=";
  assert.equal(await decryptField(token), token);
});

test("encryptJson: object is JSON-stringified and passed through unchanged", async () => {
  const obj = { line1: "123 Alabama St", city: "San Francisco", zip: "94110" };
  assert.equal(await encryptJson(obj), JSON.stringify(obj));
});

test("encryptJson: a string value is passed through as the raw string", async () => {
  assert.equal(await encryptJson("already a string"), "already a string");
});

test("encryptJson: null returns null", async () => {
  assert.equal(await encryptJson(null), null);
  assert.equal(await encryptJson(undefined), null);
});

test("encrypt/decrypt round-trip is lossless on the no-key passthrough path", async () => {
  const value = "Daniel Okafor";
  const stored = await encryptField(value);
  assert.equal(await decryptField(stored), value);
});

/* ---- REAL AES-GCM path (test-mode key hook supplies PII_ENCRYPTION_KEY) ---- */

test("with a real key: encryptField produces an enc:v1 token, not plaintext", async () => {
  await withKey(freshKeyB64(), async () => {
    const plaintext = "Marisol Reyes";
    const ct = await encryptField(plaintext);
    assert.ok(ct, "expected ciphertext");
    assert.notEqual(ct, plaintext, "ciphertext must differ from plaintext");
    assert.ok(ct!.startsWith("enc:v1:"), `expected enc:v1: prefix, got ${ct}`);
    // Format is enc:v1:<ivB64>:<ctB64> — four colon-separated parts.
    assert.equal(ct!.split(":").length, 4);
    assert.ok(!ct!.includes(plaintext), "plaintext must not appear verbatim in the token");
  });
});

test("with a real key: encrypt→decrypt round-trips back to the original", async () => {
  await withKey(freshKeyB64(), async () => {
    for (const value of ["Marisol Reyes", "12345-6789", "March 4, 1990", "123 Alabama St, SF"]) {
      const ct = await encryptField(value);
      assert.equal(await decryptField(ct), value);
    }
  });
});

test("with a real key: the same plaintext encrypts to distinct ciphertexts (random IV)", async () => {
  await withKey(freshKeyB64(), async () => {
    const a = await encryptField("Marisol Reyes");
    const b = await encryptField("Marisol Reyes");
    assert.notEqual(a, b, "random IV must yield different tokens for identical input");
    assert.equal(await decryptField(a), "Marisol Reyes");
    assert.equal(await decryptField(b), "Marisol Reyes");
  });
});

test("with a real key: encryptJson encrypts the JSON form and decrypt restores it", async () => {
  await withKey(freshKeyB64(), async () => {
    const obj = { line1: "123 Alabama St", city: "San Francisco", zip: "94110" };
    const ct = await encryptJson(obj);
    assert.ok(ct!.startsWith("enc:v1:"));
    assert.equal(await decryptField(ct), JSON.stringify(obj));
  });
});

test("with a real key: a TAMPERED ciphertext fails to decrypt (surfaces token, not garbage)", async () => {
  await withKey(freshKeyB64(), async () => {
    const ct = await encryptField("Sensitive Case #998877");
    assert.ok(ct!.startsWith("enc:v1:"));
    // Flip a character in the ciphertext body → GCM auth tag check fails.
    const parts = ct!.split(":");
    const body = parts[3];
    const flipped = (body[0] === "A" ? "B" : "A") + body.slice(1);
    const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:${flipped}`;
    const out = await decryptField(tampered);
    // decryptField swallows the auth failure and returns the (unusable) token —
    // crucially it does NOT return the original plaintext.
    assert.notEqual(out, "Sensitive Case #998877");
    assert.equal(out, tampered);
  });
});

test("with a WRONG key: ciphertext does not decrypt to the original plaintext", async () => {
  const ct = await withKey(freshKeyB64(), () => encryptField("Top Secret PII"));
  // Different key entirely; GCM auth fails → original plaintext is never recovered.
  const out = await withKey(freshKeyB64(), () => decryptField(ct));
  assert.notEqual(out, "Top Secret PII");
});

test("FAIL-CLOSED: no key + not a test run → encryptField throws (never writes cleartext)", async () => {
  // Temporarily make isTestRun() false by clearing the signals the test runner
  // sets, AND ensure no key is present. This exercises the production guard:
  // PII must never be stored in cleartext when encryption is unconfigured.
  // process.env.NODE_ENV is typed read-only; mutate via a loosely-typed alias.
  const env = process.env as Record<string, string | undefined>;
  const saved = {
    ctx: env.NODE_TEST_CONTEXT,
    env: env.NODE_ENV,
    tended: env.TENDED_TEST,
    key: env.PII_ENCRYPTION_KEY,
  };
  delete env.NODE_TEST_CONTEXT;
  delete env.NODE_ENV;
  delete env.TENDED_TEST;
  delete env.PII_ENCRYPTION_KEY;
  try {
    await assert.rejects(
      () => encryptField("Marisol Reyes"),
      /PII_ENCRYPTION_KEY is required/,
      "expected fail-closed throw when no key and not a test/demo runtime"
    );
    // The read side fails closed too when an enc token exists but no key.
    await assert.rejects(
      () => decryptField("enc:v1:aXY=:Y3Q="),
      /PII_ENCRYPTION_KEY is required/
    );
  } finally {
    if (saved.ctx !== undefined) env.NODE_TEST_CONTEXT = saved.ctx;
    if (saved.env !== undefined) env.NODE_ENV = saved.env;
    if (saved.tended !== undefined) env.TENDED_TEST = saved.tended;
    if (saved.key !== undefined) env.PII_ENCRYPTION_KEY = saved.key;
  }
});
