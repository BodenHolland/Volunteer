import { test } from "node:test";
import assert from "node:assert";
import { encryptField, decryptField, encryptJson } from "@/lib/crypto";

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
