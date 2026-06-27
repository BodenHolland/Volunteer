import { test } from "node:test";
import assert from "node:assert";
import { sha256Hex, SESSION_COOKIE, newUserId } from "@/lib/auth";

// Authentication is owned by Firebase; the only thing lib/auth still owns is the
// revocable D1 session machinery (session token hashing + the opaque cookie).
// Session create/validate touch D1, so the DB-free surface we can unit-test is
// the SHA-256 hashing used to store session-token hashes and the cookie name.

test("sha256Hex matches the known SHA-256 of 'abc'", async () => {
  assert.equal(
    await sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  );
});

test("sha256Hex is deterministic and 64 lowercase hex chars", async () => {
  const a = await sha256Hex("session-token-sample");
  const b = await sha256Hex("session-token-sample");
  assert.equal(a, b);
  assert.equal(a.length, 64);
  assert.match(a, /^[0-9a-f]+$/);
});

test("sha256Hex differs for different inputs (token id uniqueness)", async () => {
  assert.notEqual(await sha256Hex("token-a"), await sha256Hex("token-b"));
});

test("SESSION_COOKIE is the stable opaque-session cookie name", () => {
  assert.equal(SESSION_COOKIE, "tended_session");
});

test("newUserId produces unique, prefixed ids", () => {
  const a = newUserId();
  const b = newUserId();
  assert.match(a, /^user/);
  assert.notEqual(a, b);
});
