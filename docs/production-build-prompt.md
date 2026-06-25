# colift — Production Build Brief (hand this to the build agent)

You previously built **colift** as a working prototype. Your job now is to take it
to a **real production system**: replace everything that was mocked, stubbed, or
assumed with production-grade implementations, fold in the legal requirement
changes below, and harden it to handle real people, real PII, and a real
legal-attestation document (the CF 888).

**Read first, in this order:** `CLAUDE.md`, `docs/legal-framework.md`,
`README.md` ("Known Gaps"), `migrations/0001_init.sql`. The legal framework is
binding — where it conflicts with old behavior, the framework wins.

**Keep the sound core intact:** a platform hosts massively-parallel, low-tech
civic volunteer tasks; ABAWD CalFresh recipients perform them as genuine
volunteers; *verified actual hours* generate a CF 888 that counts toward the
80-hour requirement. Do not redesign the core; productionize it.

---

## 0. Prime directives (do not violate)

1. **Never credit hours above the volunteer's actual measured time.** False
   attestation on a CF 888 is felony-adjacent (7 U.S.C. §2024, 18 U.S.C. §1001,
   Cal. Welf. & Inst. Code §10980). Under-credit is safe; over-credit is the risk.
2. **Never ship a task that is self-serving busywork.** Every task must pass the
   4-part beneficiary gate (external beneficiary · genuine need · free public
   deliverable · would-do-anyway).
3. **Never sell volunteer output.** 100% grant/donation funded; deliverables are
   given away free. No data sales, no commissioned-research revenue, ever.
4. **The certification path must be insulated from any growth/fundraising metric.**
5. **PII is sacred.** Legal name, case number, DOB, address, phone, BenefitsCal
   screenshots are highly sensitive SNAP data. Treat accordingly throughout.

---

## 1. Requirement changes since the last legal rendering (build these)

These changed the product, not just the docs:

- **Measured-engagement crediting (already begun — finish it for real).**
  `credited = min(measured_active_time, calibrated_cap)`, gated on quality.
  Production must add: an **active-session timer with idle detection**, **minimum-
  engagement floors** (cannot submit before genuine engagement), anti-gaming
  (tab-focus/heartbeat, not just start/stop), and an **immutable audit trail** of
  measured-vs-credited for every approval. The AI/task estimate is a **ceiling and
  outlier flag only** — never the credited number, and may only pull a number
  *down*.
- **Calibrated cap methodology (Change 5).** Build the data pipeline that derives
  each task's cap from the **observed median of real, quality-passing human
  sessions** (AI decomposition only seeds the first guess). Recalculate on a
  schedule (quarterly), version the caps, and store the written methodology as the
  audit defense.
- **4-part task gate enforcement (Change 3).** No task template reaches `active`
  without passing the gate. Build a **task-approval workflow**: proposed templates
  are reviewed (human + AI-assisted) against the four criteria; reframe any
  self-serving/learning task into one with a free public deliverable. Prioritize
  translation/plain-language QA for LEP residents, civic data routed to agencies,
  and public-archive transcription.
- **Free public-deliverable distribution (Changes 1–3).** The outputs must
  actually reach beneficiaries. Build the **deliverable handoff/publishing
  system**: route civic data to the sponsoring agency, publish guides/translations
  to a free public repository / partner libraries, with provenance and licensing
  (public domain / CC0). This is what makes the work charitable.
- **One-account-per-person + anti-farming (Change 8).** Enforce a single verified
  account per person; detect and block one person farming multiple case numbers
  (link analysis across case number, device, address, payment-free signals).
- **Per-county pre-clearance gating (Change 8).** Certification in a county is
  **disabled by default** and only enabled after **written CDSS/county
  confirmation** is recorded. Build per-county configuration; pilot in 1–2 counties
  before any broader rollout. Surface "not yet available in your county" states.
- **Certification insulation (Change 6).** Architect the verification/certification
  subsystem so its decisions and methodology are governed separately from product
  growth and fundraising; no metric or incentive may pressure hour inflation.
  Audit every certification decision.
- **Citation correctness.** All legal/user-facing copy uses **7 CFR
  §273.24(a)(2)(iii) + CDSS ACL 25-34** as the unpaid-work authority; never cite
  §273.7 or 29 CFR §553.101 for these purposes. Conform crediting to the verified
  CF 888 Section 2 wording.

---

## 2. Systems the prototype faked — build them for real

For each: replace the stub, add tests, handle the error/empty/loading states, and
instrument it.

| Prototype stub | Production system to build |
|---|---|
| Cookie-only password gate + a "soft session" identity-swap cookie | Real **authentication**: per-person accounts, secure sessions (rotation, expiry, revocation), CSRF protection, account recovery, lockout. **No identity-swap.** |
| Phone OTP accepts `123456` | Real **SMS verification** via a provider (e.g., Twilio Verify): rate-limited, fraud-aware, with resend/backoff and audit. |
| BenefitsCal screenshot stored, OCR skipped, auto-marked verified | Real **enrollment verification (Tier 3)**: OCR/parse the screenshot (or a better signal), human-review fallback, store securely, and gate first CF 888 on a genuine pass — not an auto-flag. |
| AI validation falls back to "needs a human look" with no key | Production **submission-validation pipeline**: reliable model calls with retries/timeouts/circuit-breaking, structured-output validation, cost controls, a **review queue with human-in-the-loop**, and the AI estimate used **only** as a ceiling/flag. Async via a real **queue** (not best-effort `waitUntil`). |
| Fraud signals = SHA-256 dup, EXIF geotag, velocity, AI-content heuristic | Full **integrity/fraud layer (Tier 4)**: device fingerprinting, location consistency, velocity at scale, robust duplicate/near-duplicate image detection, image provenance (EXIF + tamper checks), AI-generated-content detection, link analysis for multi-account farming. Tunable thresholds, reviewer tooling, appeals. |
| CF 888 *recreated* with pdf-lib (official XFA form unparseable) | Resolve to a **legally reviewed CF 888 output**: either correctly fill the official CDSS form (decrypt/flatten the XFA pipeline) or get the validated recreation **reviewed and signed off** by counsel/CDSS. Generate immutable, audit-logged PDFs; store signed copies; verify Section 2 wording matches the current official revision. |
| Org "team" page is display-only | Real **org RBAC + team management**: invite/remove members, role assignment (reviewer / org_admin), least-privilege, audit. |
| Settings: delete account / notifications are placeholders | Real **account lifecycle**: data export, account deletion with retention/legal-hold rules, working **notification preferences**. |
| No email/SMS/push notifications | Real **notification system**: transactional email + SMS (submission received, approved/needs-changes, CF 888 ready, county-availability), with preferences and deliverability. |
| In-memory/best-effort AI dispatch | Durable **job/queue infrastructure** (Cloudflare Queues or equivalent) for validation, fraud scans, PDF generation, deliverable publishing — with retries and dead-letter handling. |
| `/admin/reset` wipes/reseeds; seed data is demo personas | Replace with **real admin/ops tooling**: user/org/submission management, moderation, dispute/appeal handling, audit views. No destructive reset in prod. Remove demo seed personas. |
| `hours_ledger` mutated on approve | Make the ledger an **append-only, immutable, audited** record of certified hours; certified CF 888s are legal artifacts and must be tamper-evident and reproducible. |

---

## 3. Cross-cutting production engineering (the prototype had none of this)

- **Security:** authz on every route/action (not just middleware), input validation
  everywhere, output encoding, rate limiting, secret management (no secrets in
  repo/config), encryption in transit and at rest, OWASP Top-10 review, dependency
  scanning, and a third-party penetration test before launch.
- **Privacy & compliance:** PII data map; field-level encryption for case number,
  DOB, legal name, address, and screenshots; strict access controls + access
  audit logs; data-retention & deletion policy; CCPA/CPRA handling; a privacy
  policy and consent flow; principle of least data. Consider what must be retained
  for the CF 888 audit trail vs. minimized.
- **Reliability & ops:** structured logging, metrics, distributed tracing, alerting,
  uptime SLOs, automated **D1 backups + tested restore/DR**, idempotent server
  actions, graceful degradation.
- **Quality & delivery:** comprehensive automated tests (unit, integration, e2e),
  a **staging environment**, working **CI/CD** (GitHub → Cloudflare; fix the
  Workers Builds config or use Actions with a scoped API token), migration strategy
  with rollback, feature flags, and seedless environment bootstrapping.
- **Accessibility:** full WCAG 2.1 AA conformance with screen-reader and keyboard
  audits (this serves vulnerable users — non-negotiable).
- **Internationalization:** the platform serves limited-English residents — ship
  **at least English + Spanish** UI, and design tasks/notifications for i18n. (An
  English-only platform for LEP translation tasks is a contradiction.)
- **Scale:** the model is massively parallel — design for many concurrent
  volunteers and submissions: queue-backed processing, R2/D1 limits and sharding
  plan, caching, and image-handling at volume.
- **Observability of the legal invariants:** dashboards/alerts that prove the hard
  lines hold (e.g., assert no `credited > measured` ever occurs; flag any task that
  went active without passing the gate; alert if certification volume correlates
  with fundraising events).

---

## 4. Explicitly forbidden (carry over from the framework)

ID.me or third-party identity brokers; facial recognition; selfie + photo-ID
upload; SSN collection; credit checks; selling/aggregating/monetizing volunteer
data in any form; crediting hours above measured time; shipping self-serving tasks;
certifying in a county without recorded written pre-clearance.

---

## 5. Definition of done (production)

- Real auth, SMS verification, enrollment verification, notifications, RBAC, and
  account lifecycle are live — no demo bypasses remain.
- Hours crediting is provably `min(measured, cap)` with idle detection and an
  immutable measured-vs-credited audit trail; the AI estimate cannot raise credit.
- Every active task has passed the 4-part gate via a real approval workflow, and
  completed deliverables are actually published/handed to beneficiaries for free.
- CF 888 output is legally reviewed, official-revision-accurate, immutable, and
  reproducible from the audited ledger.
- Per-county certification gating works; certification is architecturally insulated
  from growth metrics.
- Security review + pen test passed; PII encrypted and access-audited; backups and
  DR tested; CI/CD + staging + automated tests in place; WCAG 2.1 AA; English +
  Spanish.
- A documented, calibrated cap methodology with a recurring recalibration job.

---

## 6. Suggested phasing (you decide specifics)

1. **Foundation:** real auth + sessions + RBAC; PII encryption; queues; CI/CD +
   staging + test harness; observability.
2. **Verification & integrity:** SMS OTP, enrollment verification, fraud/Tier-4
   layer, one-account-per-person.
3. **Hours integrity:** idle-aware engagement timer, min-engagement floors,
   measured-vs-credited audit, cap-calibration pipeline.
4. **Task & deliverable system:** 4-part gate approval workflow; public-deliverable
   distribution to beneficiaries.
5. **Certification:** legally-reviewed CF 888, immutable ledger, per-county
   pre-clearance gating, certification insulation, full audit.
6. **Scale, i18n (EN/ES), accessibility, security review + pen test, launch.**

Ask clarifying questions on anything legally or architecturally load-bearing
before building it. When in doubt, choose the option that under-credits hours and
over-protects PII.
