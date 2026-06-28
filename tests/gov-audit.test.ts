import { test } from "node:test";
import assert from "node:assert";
import {
  ANCHOR_CAP_SECONDS,
  certifiedMinutes,
  checkSsrfUrl,
  classifyDevice,
  integrityScore,
  isOfficialDomain,
  isPageRubricComplete,
  navTrailEntry,
  stripUrl,
  urlDomain,
  type AnchorCorroboration,
  type GovAuditPageEvalRow,
} from "@/lib/gov-audit";

// ---------- URL hygiene (PRD §4.2, §9) ----------

test("stripUrl removes query strings and fragments", () => {
  assert.equal(
    stripUrl("https://www.benefits.gov/search?name=Jane+Doe&ssn=123"),
    "https://www.benefits.gov/search"
  );
  assert.equal(stripUrl("https://ca.gov/apply#section-2"), "https://ca.gov/apply");
  assert.equal(stripUrl("https://ca.gov/"), "https://ca.gov");
});

test("stripUrl tolerates non-absolute input by trimming after ? or #", () => {
  assert.equal(stripUrl("/apply?x=1"), "/apply");
  assert.equal(stripUrl(""), "");
  assert.equal(stripUrl(null), "");
});

test("urlDomain returns registrable host without www", () => {
  assert.equal(urlDomain("https://www.usa.gov/food-stamps"), "usa.gov");
  assert.equal(urlDomain("https://benefitscal.com/x"), "benefitscal.com");
  assert.equal(urlDomain("not a url"), "");
});

test("navTrailEntry strips query strings from logged URLs", () => {
  const e = navTrailEntry("https://ca.gov/lookup?addr=123+Main+St", 1000);
  assert.equal(e.url, "https://ca.gov/lookup");
  assert.equal(e.domain, "ca.gov");
  assert.equal(e.at, 1000);
});

test("isOfficialDomain recognizes .gov/.mil/.us", () => {
  assert.equal(isOfficialDomain("www.usa.gov"), true);
  assert.equal(isOfficialDomain("army.mil"), true);
  assert.equal(isOfficialDomain("dmv.ca.us"), true);
  assert.equal(isOfficialDomain("example.com"), false);
});

// ---------- SSRF gate (H2) ----------

test("checkSsrfUrl allows https gov/mil/us hosts", () => {
  assert.equal(checkSsrfUrl("https://www.usa.gov/food-stamps").ok, true);
  assert.equal(checkSsrfUrl("https://dmv.ca.gov/").ok, true);
  assert.equal(checkSsrfUrl("https://army.mil").ok, true);
  assert.equal(checkSsrfUrl("https://dmv.ca.us/apply").ok, true);
});

test("checkSsrfUrl rejects non-https schemes", () => {
  assert.equal(checkSsrfUrl("http://www.usa.gov").reason, "scheme");
  assert.equal(checkSsrfUrl("ftp://www.usa.gov").reason, "scheme");
  assert.equal(checkSsrfUrl("file:///etc/passwd").reason, "scheme");
  assert.equal(checkSsrfUrl("javascript:alert(1)").reason, "scheme");
});

test("checkSsrfUrl rejects non-official hosts even over https", () => {
  assert.equal(checkSsrfUrl("https://evil.com").ok, false);
  assert.equal(checkSsrfUrl("https://evil.com").reason, "not_official");
  // A gov-looking subdomain on a non-gov registrable domain is not official.
  assert.equal(checkSsrfUrl("https://www.usa.gov.evil.com").reason, "not_official");
});

test("checkSsrfUrl blocks localhost and private/loopback/link-local IPs", () => {
  assert.equal(checkSsrfUrl("https://localhost/").reason, "private_host");
  assert.equal(checkSsrfUrl("https://foo.localhost/").reason, "private_host");
  assert.equal(checkSsrfUrl("https://127.0.0.1/").reason, "private_host");
  assert.equal(checkSsrfUrl("https://10.0.0.5/").reason, "private_host");
  assert.equal(checkSsrfUrl("https://172.16.0.1/").reason, "private_host");
  assert.equal(checkSsrfUrl("https://192.168.1.1/").reason, "private_host");
  assert.equal(checkSsrfUrl("https://169.254.169.254/latest/meta-data/").reason, "private_host"); // cloud metadata
  assert.equal(checkSsrfUrl("https://[::1]/").reason, "private_host");
  assert.equal(checkSsrfUrl("https://[fd00::1]/").reason, "private_host");
});

test("checkSsrfUrl rejects public IP literals (never on the gov allowlist)", () => {
  assert.equal(checkSsrfUrl("https://8.8.8.8/").reason, "not_official");
});

test("checkSsrfUrl rejects empty and unparseable input without throwing", () => {
  assert.equal(checkSsrfUrl("").reason, "empty");
  assert.equal(checkSsrfUrl(null).reason, "empty");
  assert.equal(checkSsrfUrl("not a url").reason, "unparseable");
});

// ---------- Device classification (PRD §11 desktop-only) ----------

test("classifyDevice distinguishes desktop, mobile, tablet", () => {
  assert.equal(
    classifyDevice(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
    ),
    "desktop"
  );
  assert.equal(
    classifyDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605 Mobile/15E148"),
    "mobile"
  );
  assert.equal(classifyDevice("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605"), "tablet");
  assert.equal(classifyDevice(null), "unknown");
});

// ---------- Rubric completeness gate ----------

const completePage = (): Partial<GovAuditPageEvalRow> => ({
  accessibility: "pass",
  acc_alt_text: "pass",
  acc_keyboard_nav: "partial",
  acc_contrast: "pass",
  acc_zoom_200: "fail",
  task_completion: "pass",
  maintained: "cant_tell",
  nav_1to5: 4,
  clarity_1to5: 5,
  trust_1to5: 3,
  overall_1to5: 4,
});

test("isPageRubricComplete requires all observables and all four Likerts", () => {
  assert.equal(isPageRubricComplete(completePage()), true);
  assert.equal(isPageRubricComplete({ ...completePage(), acc_contrast: undefined }), false);
  assert.equal(isPageRubricComplete({ ...completePage(), overall_1to5: undefined }), false);
  assert.equal(isPageRubricComplete({ ...completePage(), nav_1to5: 0 }), false);
});

// ---------- certified_minutes (PRD §4.4) ----------

test("certifiedMinutes caps each anchor at 20 minutes and floors to whole minutes", () => {
  // 50s on a complete anchor floors to 0 minutes.
  assert.equal(certifiedMinutes([{ time_on_anchor_sec: 50, rubricComplete: true }]), 0);
  // 130s → 2 minutes.
  assert.equal(certifiedMinutes([{ time_on_anchor_sec: 130, rubricComplete: true }]), 2);
  // 2 hours on one anchor is capped at 20 minutes.
  assert.equal(certifiedMinutes([{ time_on_anchor_sec: 7200, rubricComplete: true }]), 20);
  assert.equal(ANCHOR_CAP_SECONDS, 1200);
});

test("certifiedMinutes ignores anchors with an incomplete rubric", () => {
  assert.equal(
    certifiedMinutes([
      { time_on_anchor_sec: 1200, rubricComplete: false },
      { time_on_anchor_sec: 1200, rubricComplete: true },
    ]),
    20
  );
});

// ---------- integrity_score corroboration (PRD §6, §9) ----------

const corr = (o: Partial<AnchorCorroboration> = {}): AnchorCorroboration => ({
  accessibility: "pass",
  axeViolations: 0,
  loadOk: true,
  rubricComplete: true,
  ...o,
});

test("integrityScore is 1.0 when rubric complete and auto-checks agree", () => {
  assert.equal(integrityScore([corr({ axeViolations: 0 })]), 1);
});

test("integrityScore penalizes a 'pass' rating contradicted by many axe violations", () => {
  // >=10 violations against a "pass": corroboration 0.5 → 0.5*1 + 0.5*0.5 = 0.75.
  assert.equal(integrityScore([corr({ axeViolations: 12 })]), 0.75);
  // >=3 violations: corroboration 0.75 → 0.875 → rounds to 0.88.
  assert.equal(integrityScore([corr({ axeViolations: 3 })]), 0.88);
});

test("integrityScore treats a missing auto-check as neutral (no penalty)", () => {
  assert.equal(integrityScore([corr({ axeViolations: null })]), 1);
});

test("integrityScore drops when half the anchors have incomplete rubrics", () => {
  // completeFrac 0.5, both corroborate fully → 0.5*0.5 + 0.5*1 = 0.75.
  assert.equal(
    integrityScore([corr({ rubricComplete: true }), corr({ rubricComplete: false })]),
    0.75
  );
});

test("integrityScore returns 0 for an empty anchor set", () => {
  assert.equal(integrityScore([]), 0);
});
