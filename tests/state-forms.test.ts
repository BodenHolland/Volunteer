import assert from "node:assert";
import test from "node:test";
import { getStateFormSpec } from "@/lib/forms";

test("official forms and colift certificates have explicit, safe kinds", () => {
  assert.equal(getStateFormSpec("CA").kind, "official");
  assert.equal(getStateFormSpec("NM").kind, "official");
  assert.equal(getStateFormSpec("TX").kind, "certificate");
  assert.equal(getStateFormSpec("TX").formId, "Volunteer Hours Verification Certificate");
});
