import { test } from "node:test";
import assert from "node:assert";
import { hashPassword, verifyPassword } from "@/lib/auth";

test("hashPassword/verifyPassword round-trip", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.equal(await verifyPassword("correct horse battery staple", hash), true);
});

test("wrong password fails", async () => {
  const hash = await hashPassword("s3cret-pw");
  assert.equal(await verifyPassword("not-the-password", hash), false);
});

test("PBKDF2 stored format is pbkdf2$iters$salt$hash", async () => {
  const hash = await hashPassword("anything");
  const parts = hash.split("$");
  assert.equal(parts.length, 4);
  const [scheme, iters, saltHex, hashHex] = parts;
  assert.equal(scheme, "pbkdf2");
  assert.equal(Number(iters), 100_000);
  // 16-byte salt → 32 hex chars
  assert.equal(saltHex.length, 32);
  assert.match(saltHex, /^[0-9a-f]+$/);
  // 256-bit derived key → 64 hex chars
  assert.equal(hashHex.length, 64);
  assert.match(hashHex, /^[0-9a-f]+$/);
});

test("each hash uses a fresh random salt (non-deterministic)", async () => {
  const a = await hashPassword("same-password");
  const b = await hashPassword("same-password");
  assert.notEqual(a, b);
  // ...yet both verify
  assert.equal(await verifyPassword("same-password", a), true);
  assert.equal(await verifyPassword("same-password", b), true);
});

test("verifyPassword rejects null / malformed / non-pbkdf2 stored values", async () => {
  assert.equal(await verifyPassword("pw", null), false);
  assert.equal(await verifyPassword("pw", "bcrypt$10$abc$def"), false);
});

test("constant-time compare: a single flipped bit in the stored hash fails", async () => {
  const hash = await hashPassword("constant-time");
  const parts = hash.split("$");
  // flip the last hex nibble of the derived key
  const last = parts[3].slice(-1);
  const flipped = last === "f" ? "e" : "f";
  parts[3] = parts[3].slice(0, -1) + flipped;
  const tampered = parts.join("$");
  assert.equal(await verifyPassword("constant-time", tampered), false);
});

test("empty password round-trips", async () => {
  const hash = await hashPassword("");
  assert.equal(await verifyPassword("", hash), true);
  assert.equal(await verifyPassword("x", hash), false);
});
