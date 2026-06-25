# PRD — Zooniverse-verified citizen-science tasks (colift edition)

Translated from the generic Zooniverse Verified Research Classifications PRD
into the colift stack and conventions (Next.js 15 + D1 + R2 + server actions
+ PBKDF2 sessions, see [CLAUDE.md](../CLAUDE.md)). This file is the source of
truth; do not implement from the generic version.

---

## 1. Why this PRD differs from the generic one

The generic PRD assumes Firebase, Firestore security rules, Flutter clients,
and a greenfield submission system. colift already has:

- D1 schema with `task_templates → submissions → submission_files →
  submission_flags → hours_ledger → cf888_forms`.
- Real `email+password` auth, server-side sessions, `role` and `org_role`
  role-gates ([lib/session.ts](../lib/session.ts)).
- An admin/reviewer queue pattern (food-audit) we can mirror.
- A mandatory **public/private cluster split** for every dataset-producing
  feature (CLAUDE.md data principle). The generic PRD has **no** public
  cluster — that has to be added.
- A 4-part task-eligibility gate that every catalog entry must pass
  ([docs/legal-framework.md](legal-framework.md)).

So the rewrite collapses the generic PRD's seven new collections into
**three new D1 tables** + columns on existing tables, plugs the new flow
into the existing submission state machine, and adds the missing public
cluster.

---

## 2. Product summary (unchanged in intent)

A volunteer picks an admin-approved Zooniverse project from the colift
catalog, completes classifications on Zooniverse signed into their own
account, then returns to colift and uploads a **Zooniverse Volunteer
Certificate** (PDF/PNG). A reviewer confirms the certificate is in scope and
authentic-looking, the credited hours land in `hours_ledger`, and the
volunteer can download a monthly **Civic Shift Activity Record** for the
work — separate from the CF 888 but, for CA-CalFresh recipients, drawing
from the same ledger.

A direct-API path (server-side OAuth → Panoptes API) is **out of scope for
this PRD's shipping work**. It is reserved behind a disabled feature flag,
spec'd in §11, and gated on a written Zooniverse partnership.

---

## 3. Goals / non-goals

**Goals**
1. Let recipients complete approved Zooniverse projects and submit them as
   colift activity.
2. Verify hours via Zooniverse Volunteer Certificate + reviewer judgement.
3. Credit hours to `hours_ledger` using the existing cap rule:
   `credited = min(measured_from_certificate, max_hours_for_month)`.
4. Generate a portable **Civic Shift Activity Record** (HTML + PDF)
   distinct from the CF 888.
5. Ship a free public dataset of citizen-science contribution stats
   (no PII), per the colift data principle.

**Non-goals**
1. No automatic / OCR-based approval in v1.
2. No Zooniverse password collection. No password OAuth grant. Ever.
3. No screen recording, no passive browser-time measurement.
4. No claim that Zooniverse, NASA, Adler, or any agency *certified* a
   colift report — only that the underlying activity was provider-recorded.
5. No direct API integration in v1 (see §11).
6. No new task category — Zooniverse tasks live in the existing
   `task_templates` table under category `citizen_science`.

---

## 4. Identity & role mapping

| Generic PRD term            | colift mapping                                                  |
|-----------------------------|-----------------------------------------------------------------|
| "Firebase uid"              | `users.id` (TEXT PRIMARY KEY)                                   |
| "volunteer"                 | `users.role='recipient'`                                        |
| "Civic Shift reviewer"      | `users.role='org_member' AND org_role='reviewer'` belonging to a designated reviewer org (seeded as **"Civic Shift Citizen Science"**, `is_fictional=0`) |
| "Civic Shift admin"         | `users.role='admin'`                                            |
| "partner organization"      | Recipient-facing concept — receives the activity record. No new role. |
| Firestore security rules    | Server actions + `require*` gates + explicit `WHERE user_id = ?` filters |

A Zooniverse task in `task_templates` has `org_id` pointing to the
"Civic Shift Citizen Science" reviewer org. That org's reviewers (and
platform admins) are the only users who can see the review queue for these
submissions. This mirrors the existing FUF reviewer pattern.

---

## 5. Schema changes (single migration: `0019_zooniverse.sql`)

### 5.1 New columns on `task_templates`

```sql
ALTER TABLE task_templates ADD COLUMN external_provider TEXT
  CHECK (external_provider IN ('zooniverse'));
ALTER TABLE task_templates ADD COLUMN evidence_mode TEXT
  NOT NULL DEFAULT 'in_app'
  CHECK (evidence_mode IN ('in_app','external_certificate'));
ALTER TABLE task_templates ADD COLUMN monthly_minutes_cap INTEGER;
```

- `external_provider IS NULL` for existing tasks (food-audit etc.).
- `evidence_mode='external_certificate'` triggers the new submit flow.
- `monthly_minutes_cap` overrides `max_hours` for monthly aggregation when
  set (Zooniverse caps cumulative provider time per reporting month, not
  per submission).

### 5.2 New table: `external_project_catalog`

Per-task catalog metadata that doesn't fit in `task_templates`. One row per
`task_template_id`.

```sql
CREATE TABLE external_project_catalog (
  task_template_id        TEXT PRIMARY KEY REFERENCES task_templates(id),
  provider                TEXT NOT NULL CHECK (provider IN ('zooniverse')),
  external_project_id     TEXT NOT NULL,
  external_project_slug   TEXT NOT NULL,
  project_url             TEXT NOT NULL,
  allowed_workflow_ids    TEXT NOT NULL DEFAULT '[]',  -- JSON array
  public_benefit_summary  TEXT NOT NULL,
  task_type_label         TEXT NOT NULL,
  active                  INTEGER NOT NULL DEFAULT 1,
  -- 4-part eligibility gate, admin-attested at catalog-add time:
  gate_external_beneficiary INTEGER NOT NULL,
  gate_genuine_need         INTEGER NOT NULL,
  gate_public_deliverable   INTEGER NOT NULL,
  gate_would_do_anyway      INTEGER NOT NULL,
  gate_attested_by_user_id  TEXT NOT NULL REFERENCES users(id),
  gate_attested_at          INTEGER NOT NULL,
  created_at                INTEGER NOT NULL
);
CREATE INDEX idx_external_project_catalog_active
  ON external_project_catalog(provider, active);
```

A task cannot be activated until all four gate flags are `1` and an admin
has attested. This enforces the [legal framework](legal-framework.md) gate
structurally, not by checklist.

### 5.3 New table: `certificate_reviews`

Structured reviewer checklist; one row per reviewed submission.

```sql
CREATE TABLE certificate_reviews (
  submission_id           TEXT PRIMARY KEY REFERENCES submissions(id),
  reviewer_id             TEXT NOT NULL REFERENCES users(id),
  cert_name_matches_user  TEXT NOT NULL CHECK (cert_name_matches_user IN ('yes','no','unclear')),
  date_range_present      TEXT NOT NULL CHECK (date_range_present     IN ('yes','no','unclear')),
  hours_present           TEXT NOT NULL CHECK (hours_present          IN ('yes','no','unclear')),
  project_scope_match     TEXT NOT NULL CHECK (project_scope_match    IN ('yes','no','unclear')),
  signature_present       TEXT NOT NULL CHECK (signature_present      IN ('yes','no','unclear')),
  duplicate_file_match    INTEGER NOT NULL,                -- 0/1
  decision                TEXT NOT NULL CHECK (decision IN ('approved','rejected','needs_information')),
  reviewer_note           TEXT,
  credited_minutes        INTEGER,                         -- the reviewer's accepted measured time
  reviewed_at             INTEGER NOT NULL
);
```

`credited_minutes` is what the reviewer attests to from the certificate;
the approval action writes `min(credited_minutes/60, remaining monthly
cap)` to `hours_ledger`.

### 5.4 New flag kinds (no schema change — extends existing `submission_flags.kind`)

The CHECK constraint on `submission_flags.kind` blocks new values, so this
migration drops + recreates that table's check. Add:

- `duplicate_certificate` (severity `flag`): another submission already
  uploaded a file with the same SHA-256.
- `cert_user_name_mismatch` (severity `warn`): reviewer marked
  `cert_name_matches_user = 'no'`.
- `monthly_cap_exceeded` (severity `warn`): approving would push the
  user's monthly total above `monthly_minutes_cap`.

### 5.5 PUBLIC cluster: `zooniverse_public_activity`

The work product. Strictly no PII. Built from `submissions` only on
approval, keyed by an opaque per-submission ref (same pattern as
`audit_public_summaries` in [0016_food_audit_public_cluster.sql](../migrations/0016_food_audit_public_cluster.sql)).

```sql
CREATE TABLE zooniverse_public_activity (
  public_session_ref      TEXT PRIMARY KEY,
  external_project_id     TEXT NOT NULL,
  external_project_slug   TEXT NOT NULL,
  task_type_label         TEXT NOT NULL,
  reporting_month         TEXT NOT NULL,            -- YYYY-MM
  credited_minutes        INTEGER NOT NULL,
  evidence_tier           TEXT NOT NULL
    CHECK (evidence_tier IN ('provider_certificate_confirmed')),
  approved_at             INTEGER NOT NULL
);
CREATE INDEX idx_zooniverse_public_month
  ON zooniverse_public_activity(reporting_month);
```

Add `submissions.public_session_ref TEXT UNIQUE` (nullable, populated only
for `evidence_mode='external_certificate'` submissions at insert time).

Erasure semantics: deleting a user's `submissions` row leaves
`zooniverse_public_activity` rows orphaned under a ref that resolves to no
person. The work product stays, the link to the person is gone.

---

## 6. R2 layout

```
verification/zooniverse/{user_id}/{submission_id}/certificate.{pdf|png|jpg}
verification/zooniverse/{user_id}/{submission_id}/screenshot.{png|jpg}
reports/zooniverse/{user_id}/{reporting_month}.pdf
```

Private bucket; never served directly. Reviewer access is through a
role-gated server action that streams the file with a short-lived signed
URL or proxies it inline.

---

## 7. Volunteer flow (MVP — certificate upload)

1. `/app/tasks` lists active templates; Zooniverse entries render with a
   "Citizen science" pill and the project name.
2. `/app/tasks/[id]` for an `evidence_mode='external_certificate'` task
   shows:
   - Project name, public benefit summary, task type label.
   - "Open Zooniverse" button → opens `project_url` in a new tab.
   - "Return with certificate" CTA → `/app/tasks/[id]/commit` (new variant).
   - "How verification works" accordion.
   - Explicit disclaimer: *"colift is not Zooniverse. We verify the
     certificate Zooniverse generates for your account."*
3. **Commit** creates a `submissions` row with
   `status='committed'`, `public_session_ref` set, and redirects to
   `/app/projects/[id]` (existing project hub). For external tasks the
   project hub hides the in-app timer + checklist and shows a single
   "Upload certificate" CTA.
4. **Submit** (`/app/projects/[id]/submit` for external mode):
   - Reporting month picker (default = current month).
   - Certificate upload (PDF/PNG/JPG, ≤15 MB).
   - Optional screenshot upload.
   - Activity description, 25–500 chars.
   - Attestation checkbox (copy in §13).
   - On submit: upload to R2, compute SHA-256, run duplicate check against
     all prior `submission_files.kind='zooniverse_certificate'` rows (any
     user), insert `submission_files` row, transition submission to
     `pending_review`. Skip the AI validator entirely — there is no AI step
     for external evidence in MVP.
5. **Status** screen polls `submissions.status` and shows the standard
   `pending_review → approved | needs_changes | rejected` UI.

---

## 8. Reviewer flow

1. The reviewer org's queue at `/org/queue` already lists
   `status='pending_review'` submissions for the reviewer's org. No new
   route needed; the queue filter is already org-scoped.
2. New review page `/org/queue/[id]` variant renders for external
   certificates:
   - Inline PDF/PNG preview of the certificate (server-proxied).
   - Volunteer's activity description.
   - Optional screenshot preview.
   - Structured checklist matching `certificate_reviews` columns.
   - Credited minutes input (reviewer types from certificate).
   - "Approve" / "Needs information" / "Reject" buttons.
3. **Approve** action:
   - Insert `certificate_reviews` row.
   - Compute `cap_remaining = monthly_minutes_cap - sum(credited_minutes for this user, this template, this month, already approved)`.
   - `credited_to_grant = max(0, min(credited_minutes, cap_remaining))`.
   - If `credited_to_grant < credited_minutes`, write a
     `monthly_cap_exceeded` flag (warn) — reviewer is told before the
     final click.
   - Update `submissions.status='approved'`, `hours_credited=credited_to_grant/60`,
     `reviewed_at=now`, `reviewer_id`.
   - Upsert `hours_ledger` row keyed by
     `(user_id, reporting_month, certified_org_id='Civic Shift Citizen Science')` — same code path as
     [audit-actions.ts:692](../app/app/audits/[id]/audit-actions.ts:692).
   - Insert `zooniverse_public_activity` row (one row per approved
     submission, public cluster).

---

## 9. Civic Shift Activity Record

Distinct from CF 888. Generated on demand at
`/app/zooniverse-report/[month]` and downloadable as a PDF at
`/api/reports/zooniverse/[user_id]/[month].pdf` (role-gated to the
recipient themselves + admins).

Built from: `users` + `submissions` (this user, this month,
external_certificate, approved) + `certificate_reviews` +
`external_project_catalog` + `hours_ledger`.

Rendered fields (PDF and HTML versions):

```
Civic Shift Activity Record
Participant:               {legal_name or full_name}
Reporting period:          {YYYY-MM}
Provider:                  Zooniverse
Approved projects:         {list of project_name}
Research activity category: Citizen science / image classification
Provider evidence type:    Provider certificate confirmed
Provider-recorded minutes: {sum of certificate_reviews.credited_minutes}
Civic Shift credited hours: {hours_ledger.total_hours for this user/month/org}
Civic Shift reviewer:      {reviewer name}
Decision date:             {latest reviewed_at}
Submission IDs:            {list}

Limitations
This record documents activity reported by Zooniverse and reviewed by
Civic Shift. It does not represent certification, sponsorship, or approval
by Zooniverse, Adler Planetarium, NASA, a project research team, or any
government agency. Acceptance of this record is determined by the
receiving organization or program.
```

**Interaction with CF 888.** For a CA-CalFresh recipient who also has
non-Zooniverse approved work, both flows write to `hours_ledger` and the
CF 888 generator already sums all rows for `(user_id, month)`. No change
to `lib/cf888.ts`. The activity record is additive, not a replacement.

---

## 10. Public dataset endpoint

Free, no auth, no rate limit (beyond standard middleware), CC0:

```
GET /api/data/zooniverse-activity.csv
GET /api/data/zooniverse-activity.json
```

Schema (one row per approved submission):

```
public_session_ref, external_project_id, external_project_slug,
task_type_label, reporting_month, credited_minutes,
evidence_tier, approved_at
```

Built **only** from `zooniverse_public_activity`. No join to `users`,
`submissions`, or any private table is allowed in the endpoint. This is
the structural guarantee — the public table simply does not have PII
columns to leak. Linked from `/data` listing page.

---

## 11. Direct API path (out of scope for this PRD's shipping work)

Reserved feature flag: `ZOONIVERSE_DIRECT_API_ENABLED` in `.dev.vars` /
environment. **Default: false. Do not implement in v1.**

Authorization gate (all must be true before any code merges):

1. Zooniverse confirms in writing that colift may use a user-delegated
   OAuth flow.
2. Confirmed grant type and scopes.
3. Token storage security review (uses `lib/crypto.ts` AES-GCM at rest in
   a new `provider_connections` table).
4. Test with ≥3 non-admin volunteer accounts.

When enabled, adds:

- `provider_connections (user_id, provider, external_user_id,
  encrypted_token, refresh_token, expires_at, status, ...)`
- Server route `GET /api/integrations/zooniverse/callback` for the OAuth
  return.
- Server-only adapter `lib/zooniverse.ts` exposing
  `getCurrentUser`, `listMyCompletedClassifications`, `getPersonalStats`,
  `getProject`, `getWorkflow`.
- New evidence tier `provider_api_confirmed`.
- Sync action that aggregates classifications into
  `zooniverse_public_activity` (provider_api_confirmed) and writes the
  user's `hours_ledger` directly, capped per §8.
- Storage of only normalized summaries: `classification_id`, `project_id`,
  `workflow_id`, `started_at`, `finished_at`, `duration_seconds`,
  `annotation_count`, integrity hash. **No raw annotation answers.**
- Duration calculation server-side, capped at 3h per classification,
  ignoring negative or missing timestamps.

Until that gate is cleared, the settings page shows:

> Zooniverse — Certificate uploads enabled. Direct account connection is
> not available yet.

---

## 12. Feature flags (env vars, read in server actions)

```
ZOONIVERSE_TASK_CATALOG_ENABLED     = true   # shows Zooniverse tasks in /app/tasks
ZOONIVERSE_CERTIFICATE_FLOW_ENABLED = true   # MVP
ZOONIVERSE_DIRECT_API_ENABLED       = false  # §11
ZOONIVERSE_PUBLIC_DATASET_ENABLED   = true   # /api/data/zooniverse-activity.*
```

---

## 13. Required copy

**Task detail disclaimer** (always shown above the Open Zooniverse button):

> colift is not Zooniverse and does not represent Zooniverse, NASA, Adler
> Planetarium, or any research project team. You will complete this work
> on Zooniverse using your own account. Return here with the certificate
> Zooniverse generates and a colift reviewer will verify it.

**Submission attestation:**

> I confirm that I completed the activity described in this submission.
> The attached evidence is accurate to the best of my knowledge. I
> understand that colift may reject or revise this record if evidence is
> incomplete, duplicated, inconsistent, or outside the approved task
> rules.

**Activity Record limitations** (§9): as quoted.

---

## 14. Acceptance criteria (MVP)

Functional:

- [ ] Admin can create a Zooniverse `task_templates` row via
      `/admin/tasks` with all four gate flags attested; activation is
      blocked otherwise.
- [ ] Recipient sees Zooniverse tasks in `/app/tasks` with the project
      name and a "Citizen science" pill.
- [ ] Task detail renders the disclaimer above "Open Zooniverse".
- [ ] Commit creates a `submissions` row with `public_session_ref` set.
- [ ] Submit accepts PDF/PNG/JPG ≤15 MB, computes SHA-256, blocks
      duplicates across all users, transitions to `pending_review`.
- [ ] Reviewer queue at `/org/queue` shows external-certificate
      submissions for the "Civic Shift Citizen Science" reviewer org.
- [ ] Reviewer can preview the certificate inline, fill the structured
      checklist, and approve/reject/request-info.
- [ ] Approve writes `certificate_reviews`, updates `submissions`, upserts
      `hours_ledger`, and inserts `zooniverse_public_activity`.
- [ ] Monthly minutes cap is enforced and surfaced to the reviewer before
      final click.
- [ ] `/app/zooniverse-report/[month]` renders the activity record HTML
      for the signed-in recipient and only the signed-in recipient.
- [ ] `/api/reports/zooniverse/[user_id]/[month].pdf` is gated to that
      user + admins.
- [ ] `/api/data/zooniverse-activity.csv` returns approved rows with no
      PII, regardless of auth state.
- [ ] For a CA-CalFresh recipient, approved Zooniverse hours appear in
      that month's CF 888 total without any change to `lib/cf888.ts`.

Security / privacy:

- [ ] Certificate files in R2 are never publicly addressable.
- [ ] Reviewer file access requires `requireOrgMember()` and a query that
      joins through the reviewer's `org_id`.
- [ ] `users` PII (legal name, case number, DOB) is never present in
      `zooniverse_public_activity` or the public dataset endpoint.
- [ ] Deleting a `submissions` row leaves `zooniverse_public_activity`
      orphaned (work product stays; link to person is gone).

Out of scope (do not build in this PRD's slice):

- [ ] Direct API / OAuth flow (§11).
- [ ] OCR auto-fill of the reviewer checklist.
- [ ] Virus scanning of uploads (deferred — add when we wire a provider).
- [ ] EXIF stripping pipeline (not relevant for cert files; defer for
      screenshots).
- [ ] Email/SMS notifications.

---

## 15. Files to add / change

**New**

```
migrations/0019_zooniverse.sql
lib/zooniverse.ts                          # catalog + cert flow helpers
lib/zooniverse-report.ts                   # activity record builder
app/admin/tasks/zooniverse/page.tsx        # admin catalog add/edit + gate
app/app/tasks/[id]/external-detail.tsx     # external task detail variant
app/app/projects/[id]/submit/external/page.tsx
app/app/projects/[id]/submit/external/submit-actions.ts
app/org/queue/[id]/external-review.tsx     # external cert review UI
app/org/queue/[id]/external-review-actions.ts
app/app/zooniverse-report/[month]/page.tsx
app/api/reports/zooniverse/[userId]/[month]/route.ts
app/api/data/zooniverse-activity.csv/route.ts
app/api/data/zooniverse-activity.json/route.ts
app/api/integrations/zooniverse/cert-file/[submissionId]/route.ts  # reviewer file proxy
public/seed/zooniverse-projects.json       # seed catalog entries
test/zooniverse-cert-flow.spec.ts
test/zooniverse-public-cluster.spec.ts
```

**Changed**

```
lib/seed.ts                                # seed reviewer org + sample Zooniverse task
lib/types.ts                               # add ExternalProjectCatalog, CertificateReview, ZooniversePublicRow
app/app/tasks/page.tsx                     # render Zooniverse pill
app/app/tasks/[id]/page.tsx                # branch on evidence_mode
app/app/projects/[id]/page.tsx             # hide timer for external tasks; show "Upload certificate" CTA
app/org/queue/[id]/page.tsx                # branch on evidence_mode
app/admin/tasks/page.tsx                   # link to /admin/tasks/zooniverse
app/data/page.tsx                          # link to public Zooniverse dataset
docs/legal-framework.md                    # cross-reference Zooniverse 4-part gate evidence
```

---

## 16. Build order

1. Migration `0019_zooniverse.sql` (schema + reseed of one Zooniverse
   sample task under the "Civic Shift Citizen Science" reviewer org).
2. `lib/types.ts` + `lib/zooniverse.ts` (catalog read + duplicate-hash
   check + capacity calc + public-row writer).
3. Volunteer task detail + commit (read-only path: discover, open
   Zooniverse, return).
4. Submit form + server action (upload, SHA-256, transition to
   `pending_review`).
5. Reviewer queue branch + structured checklist + approve action
   (writes ledger + public row).
6. Activity record HTML page + PDF route.
7. Public dataset CSV+JSON.
8. Admin catalog add/edit page with 4-part gate.
9. Tests: cert flow happy path, duplicate block, cap-exceeded warn,
   public-cluster excludes PII, CF 888 sums correctly for CA recipient.

---

## 17. Open questions (need a decision before build)

1. **Reviewer org seeding.** Do we seed a single "Civic Shift Citizen
   Science" reviewer org and assign one of the existing sample
   `org_member` users to it, or stand up a new sample reviewer? (Affects
   `lib/seed.ts` and demo script.)
2. **Activity Record scope.** Does the record cover *only* Zooniverse work
   in that month, or *all* approved colift work? The PRD as written says
   Zooniverse-only — confirm that's intended, since CF 888 already covers
   the all-work case.
3. **monthly_minutes_cap default.** Generic PRD says 600 (10h). For SNAP
   ABAWD, the volunteer needs 80h/month to satisfy the requirement;
   10h/month from a single Zooniverse project may be a useful sanity cap
   but feels low. Confirm cap value or remove cap from MVP.
4. **Catalog entries for v1.** Which Zooniverse projects ship in seed?
   (Need 1–3 admin-approved entries to demo.)
