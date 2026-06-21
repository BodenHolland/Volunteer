# Build handoff: Food Access Price Audit (Tended v1)

You're building a feature inside **Tended**, a **national** civic-work platform that lets US residents earn certified volunteer hours toward the federal SNAP/ABAWD work requirement by doing real volunteer tasks for sponsoring nonprofits. The platform operates state-by-state — each state has its own SNAP certification mechanism (CA's is CF 888; other states have analogous forms) — but the catalog, validation, and data model are nationwide.

This handoff is self-contained — you don't need to read the conversation that produced it. Read it once end-to-end before writing code so you understand the slicing.

You have two companion specs to reference:
- [`tended-v1-task-specs.json`](tended-v1-task-specs.json) — the authoritative task definition (look for `id: "food-access-price-audit"`)
- [`tended-food-audit-build-spec.md`](tended-food-audit-build-spec.md) — the rationale-and-tradeoffs companion that explains *why* the architecture looks the way it does

If anything in this handoff contradicts those, those win — flag it.

---

## 1. What you're building, in one paragraph

Volunteers visit any food retailer in their community (supermarket, bodega, ethnic market, dollar store, farmers market). The app walks them through capturing **shelf-tag prices** for a fixed 6-item basket — milk, eggs, bread, rice, canned beans, fresh produce — aligned with the USDA Thrifty Food Plan (the basis SNAP allotments are calculated against). For each item the volunteer captures: the shelf price, the package size, one photo framing the item + its price tag, or marks the item out-of-stock. The submission is validated automatically (photo vision check, price plausibility against regional medians, anti-dup), credited as ~12 minutes of volunteer time, and aggregated into a public food-access dataset stratified by region. Slice 3 also pushes contributions to the Open Prices open-data project.

## 2. Before you start — ask Boden

Don't guess on these:

1. **Stack.** What's the current Tended stack? (Frontend framework + state management; backend language + framework; database; object storage; queue/job system.) Adapt this build to existing patterns; don't introduce new tech without justification.
2. **Auth & volunteer identity.** Is there a `volunteer` / `user` table already? An auth system (Firebase Auth, NextAuth, custom)? Reuse it.
3. **Existing Task Session component.** Is there already a session-engine component that renders a configured task as an ordered list of steps? If yes, extend it. If not, see Section 6 — you're building the first version.
4. **Existing primitives.** Which of these primitives already exist in the codebase: `dial`, `open-link`, `confirm-location`, `multi-choice`, `short-text`, `photo`? You will need to add `repeat-group` (see Section 6.4) regardless.
5. **Vision model access.** Which vision model API is configured/budgeted? (Claude Sonnet, GPT-4o-mini, Gemini Flash all work.) ~$0.001/image. If none, see Section 5.2.
6. **Map/POI provider.** Is there an existing integration (Mapbox, Google Places, etc.) for store search? If not, propose one and confirm before building.
7. **Hour-credit pathway.** When an audit passes validation, how does it become "certified hours" toward the volunteer's monthly total? Reuse the existing credit-issuance pathway.

## 3. Hard rules — do not violate

These come from the federal legal framework Tended operates under (7 CFR §273.24, with state-specific certification mechanisms — California's is CF 888; each state has its own analogous form). If you find yourself violating one, stop and flag it.

- **Hour credit must reflect measured engagement.** Never auto-credit based on estimates; never let the volunteer "claim" hours. Hours = `min(measured_session_time, calibrated_cap_minutes)`. Cap = 15 min/audit; calibrated target = 12 min.
- **Photos and prices are required for every in-stock item.** No partial submissions credited.
- **No volunteer compensation beyond hour credit.** No gift cards, no payment, no incentives. The volunteer should never need to *purchase* anything — shelf-tag photos only.
- **PII screening on free-text fields.** No SSNs, no payment cards, no personal contact info in any captured field. Auto-strip and re-prompt.
- **Anti-dup is real.** Same volunteer + same store + same calendar week = reject the second submission with an explanatory message. Don't crash; explain why.
- **Geocode must be in the volunteer's registered home state, within the continental US.** Reject (with explanation) if device GPS is outside the continental US OR more than 100 miles outside the volunteer's registered home state.

## 4. Data model

Define the following entities. Field names are recommendations — adapt to existing conventions in the codebase.

### 4.1 `BasketTemplate` (config, not user data)

Static config. One row exists at launch: `usda-thrifty-6` v2026.1. Load the items list from the JSON in this handoff (Section 9).

```
id              string PK     // "usda-thrifty-6"
version         string        // "2026.1"
display_name    string        // "USDA Thrifty 6-Item Basket"
items           json[]        // see BasketItem schema below
created_at      timestamp
```

### 4.2 `BasketItem` (embedded in BasketTemplate.items)

```
id                            string    // "milk-gallon", "eggs-dozen", etc.
display_name                  string    // "Milk"
spec                          string    // human-readable spec, shown to volunteer
category                      enum      // dairy | eggs | bread | rice | beans | produce
expected_size_range_min       number
expected_size_range_max       number
expected_size_unit            enum      // gal | oz | lb | count | ml | L
plausibility_band_usd_low     number
plausibility_band_usd_high    number
unit_options                  enum[]    // which units the volunteer can pick from
size_capture                  enum      // "fixed" | "flexible" (produce only)
```

Plausibility bands and unit_options are pulled from the JSON in Section 9.

### 4.3 `Store`

```
id                  string PK
name                string
address             string
geocode_lat         number       // store location, set at first audit
geocode_lng         number
google_place_id     string?      // if matched against POI provider
created_by_volunteer_id  string FK?  // null if seeded
created_at          timestamp
```

A store row is created either by matching a POI suggestion OR by a volunteer using the "store not listed" flow. Once created, future audits at that location should resolve to the same `Store` row (POI match or address-similarity).

### 4.4 `Audit`

One row per volunteer per audit attempt.

```
id                          string PK
volunteer_id                string FK
store_id                    string FK
basket_template_id          string FK    // "usda-thrifty-6"
basket_template_version     string       // "2026.1" — captured at submission time so historical audits don't shift when template changes
store_type_observed         enum         // chain-supermarket | independent-grocery | corner-store-bodega | ethnic-market | farmers-market | dollar-store | other
ebt_observation             enum         // signage-visible | asked-staff-accepted | asked-staff-not-accepted | not-visible
started_at                  timestamp
submitted_at                timestamp?
session_time_seconds        integer      // measured active engagement (NOT wall-clock; see Section 5.4)
validation_status           enum         // draft | submitted | validating | verified | flagged | rejected
validation_flag_count       integer      // denormalized for queue queries
credited_hours              number?      // set when validation_status = "verified"; credited via existing pathway
trust_tier_at_submission    integer      // snapshot of volunteer trust tier at submit time
```

### 4.5 `AuditItemCapture`

One row per basket item per audit (6 rows per audit, always).

```
id                          string PK
audit_id                    string FK
basket_item_id              string       // "milk-gallon", "eggs-dozen", etc.
stock_status                enum         // in-stock | out-of-stock | not-sold-at-this-store
price_usd                   number?      // null if not in-stock
size_value                  number?
size_unit                   enum?
produce_pricing_mode        enum?        // per-lb | per-unit (produce only)
photo_id                    string FK?   // null if not in-stock
captured_at                 timestamp
```

### 4.6 `Photo`

```
id                          string PK
audit_id                    string FK
audit_item_capture_id       string FK
storage_url                 string       // S3/R2/Firebase Storage URL
storage_path                string
exif_timestamp              timestamp?
exif_geocode_lat            number?
exif_geocode_lng            number?
uploaded_at                 timestamp
vision_validation_status    enum         // pending | running | passed | failed | skipped
vision_result_json          json?        // raw vision-model response; see Section 5.2
ocr_price_value             number?      // extracted from vision response for cross-check
```

Photos must be stored with the original EXIF intact so geocode-vs-confirmed-store-location can be cross-checked.

### 4.7 `ValidationFlag`

One row per flagged issue on an audit. An audit can have zero or many flags. Multiple flags do not multiply rejection — they accumulate for the human reviewer.

```
id                  string PK
audit_id            string FK
flag_type           enum    // photo-no-tag | photo-no-item | ocr-mismatch | price-outlier | session-too-short | session-too-long | location-out-of-CA | anti-dup-violation | rapid-submission-pattern | pii-detected | item-category-mismatch
flag_severity       enum    // block (prevents submission) | review (flags for spot-review)
flag_reason         string  // human-readable explanation
flag_metadata       json    // structured data: which item, which photo, what was expected vs actual
created_at          timestamp
resolution_status   enum    // open | resolved-accept | resolved-reject | resolved-accept-with-correction
resolved_by_admin_id string FK?
resolved_at         timestamp?
admin_note          string?
```

### 4.8 `VolunteerTrust`

One row per volunteer.

```
volunteer_id                    string PK FK
tier                            integer    // 0 (new) | 1 (10+ clean audits) | 2 (30+ at tier 1)
audits_completed                integer
audits_flagged                  integer
audits_rejected                 integer
failed_audits_30_day_window     integer
last_recalculated_at            timestamp
```

Trust tier is recalculated after every audit reaches a terminal validation state. See Section 5.5.

## 5. Backend services

### 5.1 API endpoints

Volunteer-facing (auth required):

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/audits/start` | Create new `Audit` row in draft state, return `audit_id` and basket template |
| GET | `/api/stores/search?q=&lat=&lng=` | POI search via map provider, plus existing `Store` rows in radius |
| POST | `/api/stores` | Create new `Store` (the "not listed" flow). Geocode required. |
| PATCH | `/api/audits/:id` | Update `Audit` fields: store_id, store_type_observed, ebt_observation |
| POST | `/api/audits/:id/items/:basket_item_id` | Submit one `AuditItemCapture` (with photo upload as multipart) |
| POST | `/api/audits/:id/submit` | Finalize audit, trigger async validation |
| GET | `/api/audits/:id/status` | Polled by client for validation status changes |
| GET | `/api/audits/mine` | List own past audits (status, credited hours) |

Admin-facing (admin auth required):

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/audits?status=flagged` | Spot-review queue |
| GET | `/api/admin/audits/:id` | Full audit detail with photos, flags, captures |
| POST | `/api/admin/audits/:id/resolve` | Approve / reject / approve-with-correction |

Data export (public, rate-limited):

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/data/audits.csv` | Public CSV download (verified audits only, store_id replaced with anonymized hash if Store was volunteer-added) |
| GET | `/api/data/dashboard/state-report.json` | JSON feed for public dashboard |

### 5.2 Vision validation service

A worker that processes a queue of "photo uploaded → validate" jobs. One job per `Photo` row with status `pending`.

Input: photo URL + the basket_item.category that the photo is claimed to represent.

Vision model prompt (use this verbatim, adapt to whichever API):

```
You are validating a photo submitted by a community volunteer auditing food prices in the United States. The volunteer claims this photo shows a [CATEGORY: milk/eggs/bread/rice/beans/produce] item alongside its shelf price tag.

Return ONLY a JSON object with this exact shape:
{
  "contains_price_tag": boolean,
  "tag_is_readable": boolean,
  "ocr_price_value": number or null,
  "ocr_price_currency": "USD" or null,
  "contains_item": boolean,
  "item_category_observed": "milk" | "eggs" | "bread" | "rice" | "beans" | "produce" | "unknown",
  "confidence": number between 0 and 1,
  "notes": string (one sentence if anything unusual)
}

Do not include any text outside the JSON.
```

Persist the full response to `Photo.vision_result_json`. Set `Photo.vision_validation_status` based on the response:
- `passed`: contains_price_tag=true, tag_is_readable=true, contains_item=true, item_category_observed matches expected category
- `failed`: any of the above are false
- Edge cases (unknown category, low confidence) → `passed` but with a `ValidationFlag` of type `item-category-mismatch`

Also set `Photo.ocr_price_value` from the response for cross-checking in the next step.

### 5.3 Submission validation pipeline

When `POST /api/audits/:id/submit` fires:

**Synchronous checks (block submission):**

1. All 6 `AuditItemCapture` rows exist for this audit
2. For every capture with `stock_status = in-stock`: price_usd, size_value, size_unit, photo_id are all non-null
3. Store geocode is in the continental US AND within ~100 miles of the volunteer's registered home state (continental US bounds: lat 24.5–49.5, lng -125.0 to -66.5; state-by-state polygon validation as second check)
4. Session time between 240s (4 min) and 1500s (25 min)
5. Anti-dup: no prior `Audit` by this volunteer for this store in last 7 days
6. PII screen on free-text fields (volunteer-added store name, address)

On block, return 400 with the specific reason; client shows the user what to fix.

**Asynchronous checks (run after submission accepted):**

Set `Audit.validation_status = validating`. Enqueue:

1. **Per-item photo vision validation** (one job per in-stock item) — see 5.2
2. **OCR price cross-check** (after vision completes): for each in-stock item, compare `Photo.ocr_price_value` to `AuditItemCapture.price_usd`. If divergence > 10%, write a `ValidationFlag` of type `ocr-mismatch`
3. **Price plausibility** (per item): is `price_usd` inside `basket_item.plausibility_band_usd_low/high`? If outside, flag `price-outlier`
4. **Rapid-submission check**: more than 3 audits by this volunteer in the last 60 minutes? Flag `rapid-submission-pattern`
5. **Photo EXIF geocode check**: does `Photo.exif_geocode` (if present) fall within 100m of `Store.geocode`? If not, flag (low severity — many phones strip EXIF)

When all async checks finish:
- If `validation_flag_count == 0`: set `Audit.validation_status = verified`, credit hours via the existing pathway, fire whatever notification is standard for hour credit
- If `validation_flag_count > 0`: set `Audit.validation_status = flagged`, audit goes into admin spot-review queue. Volunteer sees "verification pending review (1–2 business days)"

### 5.4 Session-time measurement

`Audit.session_time_seconds` is **measured active engagement, not wall-clock**. Track:
- App tab is foregrounded
- User is interacting (tap, scroll, input) at least once every 60s

Pause the timer when:
- App is backgrounded
- No interaction for > 60s

This prevents inflated hours from a volunteer who opens the task and walks away. Credited hours use this measured value, capped at the basket template's max.

### 5.5 Trust tier recalculation

After any `Audit` reaches a terminal state (verified, rejected, or admin-resolved):

```
tier 0 → tier 1: audits_completed >= 10 AND failed_audits_30_day_window == 0
tier 1 → tier 2: audits_completed >= 30 AND tier was 1 for last 30 days AND failed_audits_30_day_window == 0
ANY tier → demote to tier 0: 2+ failed audits in 30-day window
```

`failed` = rejected by admin OR flagged on submission with `severity=block`.

Trust tier affects: spot-review sampling rate (tier 0: 100%, tier 1: 10%, tier 2: 3%) and photo-validation strictness band (tier 0: ±10% OCR tolerance; tier 1: ±15%; tier 2: ±20%).

## 6. Frontend

### 6.1 Volunteer flow (state machine)

```
catalog screen
  → tap "Audit food prices at a store"
  → task detail screen (description, time estimate, "Start a session" CTA)
  → tap "Start a session"
  → POST /api/audits/start → audit_id

step 1: confirm location
  → device GPS prompts nearby POIs
  → user picks a store, OR
  → searches by name/address, OR
  → drops pin and names the store (creates new Store)
  → PATCH /api/audits/:id { store_id }

step 2: store type
  → multi-choice picker (7 options from store-type taxonomy)
  → PATCH /api/audits/:id { store_type_observed }

step 3: EBT observation
  → multi-choice picker (4 options)
  → PATCH /api/audits/:id { ebt_observation }

step 4: basket items (repeat-group, 6 items)
  → 6 cards in a vertical stack, all visible at once
  → each card has 3 states: untouched | in-progress | complete (collapsed)
  → tap a card to expand and capture
    → stock-status picker first
    → if in-stock: photo capture → price input → size input → unit picker (and produce-pricing-mode picker for produce)
    → POST /api/audits/:id/items/:basket_item_id (with photo as multipart)
    → on success, card collapses to "✓ Milk: $4.99 / 1 gal"
  → "Submit" button disabled until all 6 cards are complete

submit
  → POST /api/audits/:id/submit
  → confirmation screen: "Thanks. Your audit is being verified. Hours will credit once verification passes (usually under 1 minute)."
  → background poll on GET /api/audits/:id/status

post-submission states (shown in volunteer's audit history)
  → verifying (animated indicator)
  → verified (green checkmark, hours visible)
  → review pending (yellow indicator, "1–2 business days")
  → corrections requested (rare — admin sends back with note)
  → rejected (red, with reason)
```

### 6.2 Admin spot-review screen

A list view: flagged audits sorted by `flagged_at desc`. Each row shows volunteer (anonymized id), store, flag count, flag types.

Detail view shows:
- All 6 basket items with their captured values and (if applicable) photos with vision model output overlaid
- For each flag: type, reason, metadata, suggested resolution
- Actions: Approve (credit hours), Reject (with required reason), Approve with corrections (admin can override one or more captured values; volunteer is notified)

### 6.3 Component reuse opportunity

If a Task Session component already exists, every step above maps to existing primitives (`confirm-location`, `multi-choice`, `photo`, `short-text`) except step 4. **Step 4 is the only genuinely new UI work** — see 6.4.

### 6.4 NEW PRIMITIVE: `repeat-group`

Add a primitive to the session-engine that iterates a sub-flow over a config-provided list.

Config shape:

```json
{
  "action": "repeat-group",
  "iteration_source": "basket_template.items",
  "iteration_id_field": "id",
  "iteration_label_field": "display_name",
  "sub_steps": [
    { "action": "multi-choice", "target": "stock-status", "options": [...] },
    {
      "action": "conditional",
      "if": "stock_status == 'in-stock'",
      "then": [
        { "action": "photo", "target": "item-and-tag" },
        { "action": "short-text", "target": "price-usd", "input_mode": "decimal", "prefix": "$" },
        { "action": "short-text", "target": "size-value", "input_mode": "decimal" },
        { "action": "multi-choice", "target": "size-unit", "options_from": "iteration_item.unit_options" }
      ]
    }
  ]
}
```

UI: render as a vertical stack of cards (one per iteration), each card collapsible, each with its own state (untouched / in-progress / complete). When all cards are complete, parent step is complete.

This primitive is reusable for every future audit-style task (pharmacy prices, gas prices, transit-stop observations, etc.). Build it cleanly.

## 7. Storage

### 7.1 Photos

Object storage (S3, R2, Firebase Storage — whichever Tended uses). Path scheme:

```
/audits/{audit_id}/{basket_item_id}_{photo_id}.jpg
```

- Store original (preserve EXIF for geocode + timestamp validation)
- Generate thumbnail (~400px wide) for admin spot-review screen
- Both URLs persisted on `Photo` row
- Public dashboard never exposes photos — they're for validation only
- CSV export does not include photo URLs

### 7.2 Validation queue

Whatever Tended uses for background jobs (BullMQ, Cloud Tasks, Firebase Functions queues, etc.). Idempotent: re-running a vision-validation job on the same Photo should produce the same DB state.

### 7.3 Public dataset materialization

Daily batch job rebuilds:
- `state_report.json` (one row per zip code with aggregate basket cost, OOS rates, store-type mix)
- `audits.csv` (one row per verified audit, denormalized)
- Both written to a public-readable storage path served via CDN

## 8. Slice plan — ship in this order

### Slice 1 — capture works end-to-end (4–5 days)

Goal: a volunteer can complete a real audit and a Tended admin can see + manually approve it. No automated validation yet.

Build:
- All data model entities (4.1–4.8)
- Volunteer API endpoints (5.1, volunteer-facing only)
- Volunteer frontend flow (6.1)
- `repeat-group` primitive (6.4)
- Photo upload + storage (7.1)
- Sync validation only (5.3 synchronous checks)
- Admin spot-review screen — every Slice 1 submission flags as `manual-review` and lands in queue (no automated checks yet)
- Hour credit pathway: only fires on admin approval in Slice 1

**Acceptance:** Boden can complete an audit at a real store and you (as admin) can review and approve it. The volunteer sees the credited hours.

### Slice 2 — automated validation + public dashboard (4–5 days)

Goal: audits validate themselves; only flagged ones go to admin queue. Public can see the data.

Build:
- Vision validation worker (5.2)
- Full async validation pipeline (5.3 asynchronous checks)
- `VolunteerTrust` + trust tier logic (5.5)
- Trust-tier-aware photo strictness
- Daily aggregation batch (7.3)
- Public dashboard frontend (separate page; could be a static site reading the JSON)
- Public CSV export

**Acceptance:** 100 audits flow through with < 5% flagged for admin review (assuming honest submissions). Public dashboard shows zip-level basket costs.

### Slice 3 — Open Prices contribution (2–3 days)

Goal: every verified audit also contributes to the global Open Prices open-data project.

Build:
- OFF account + auth token in env
- Product mapping table: each basket_item.id → Open Food Facts product code (need to research per item; produce is by-region so this needs care)
- Open Prices API client + retry queue
- Per-item POST after audit verifies, marked with project tag `tended-ca-food-access`
- Surface the contribution link on the volunteer's audit-history screen ("Your contributions are part of Open Prices →")

**Acceptance:** verified audits appear on prices.openfoodfacts.org under the project tag within 5 minutes.

## 9. Configuration data (paste this into the basket template seed)

```json
{
  "id": "usda-thrifty-6",
  "version": "2026.1",
  "display_name": "USDA Thrifty 6-Item Basket",
  "items": [
    {
      "id": "milk-gallon",
      "display_name": "Milk",
      "spec": "1 gallon, whole, generic/store brand",
      "category": "dairy",
      "expected_size_range_min": 1,
      "expected_size_range_max": 1,
      "expected_size_unit": "gal",
      "plausibility_band_usd_low": 2.50,
      "plausibility_band_usd_high": 12.00,
      "unit_options": ["gal", "ml", "L"],
      "size_capture": "fixed"
    },
    {
      "id": "eggs-dozen",
      "display_name": "Eggs",
      "spec": "1 dozen, large, Grade A, generic/store brand",
      "category": "eggs",
      "expected_size_range_min": 12,
      "expected_size_range_max": 12,
      "expected_size_unit": "count",
      "plausibility_band_usd_low": 1.50,
      "plausibility_band_usd_high": 15.00,
      "unit_options": ["count"],
      "size_capture": "fixed"
    },
    {
      "id": "bread-loaf",
      "display_name": "Bread",
      "spec": "1 standard loaf (16-20 oz), sliced white or whole wheat",
      "category": "bread",
      "expected_size_range_min": 16,
      "expected_size_range_max": 20,
      "expected_size_unit": "oz",
      "plausibility_band_usd_low": 1.00,
      "plausibility_band_usd_high": 10.00,
      "unit_options": ["oz", "lb"],
      "size_capture": "fixed"
    },
    {
      "id": "rice-1lb",
      "display_name": "Rice",
      "spec": "1 lb bag, standard white long-grain",
      "category": "rice",
      "expected_size_range_min": 1,
      "expected_size_range_max": 1,
      "expected_size_unit": "lb",
      "plausibility_band_usd_low": 0.50,
      "plausibility_band_usd_high": 6.00,
      "unit_options": ["lb", "oz"],
      "size_capture": "fixed"
    },
    {
      "id": "beans-can",
      "display_name": "Canned beans",
      "spec": "1 standard can (15-16 oz), black or pinto",
      "category": "beans",
      "expected_size_range_min": 15,
      "expected_size_range_max": 16,
      "expected_size_unit": "oz",
      "plausibility_band_usd_low": 0.50,
      "plausibility_band_usd_high": 5.00,
      "unit_options": ["oz"],
      "size_capture": "fixed"
    },
    {
      "id": "produce-banana-or-apple",
      "display_name": "Fresh produce (bananas or apples)",
      "spec": "Bananas or apples, per pound or per single unit (whichever the store sells)",
      "category": "produce",
      "expected_size_range_min": 0.1,
      "expected_size_range_max": 5.0,
      "expected_size_unit": "lb",
      "plausibility_band_usd_low": 0.15,
      "plausibility_band_usd_high": 5.00,
      "unit_options": ["lb", "count"],
      "size_capture": "flexible",
      "extra_field": {
        "id": "produce_pricing_mode",
        "type": "multi-choice",
        "options": ["per-pound", "per-unit"],
        "required": true
      }
    }
  ]
}
```

Store type taxonomy (multi-choice options for `Audit.store_type_observed`):

```
chain-supermarket          // Safeway, Kroger, Albertsons, Walmart, Target
independent-grocery        // local non-chain
corner-store-bodega        // small neighborhood store
ethnic-market              // Asian, Latino, Halal, etc.
farmers-market
dollar-store               // Dollar Tree, 99 Cents Only, Dollar General
other
```

EBT observation taxonomy (multi-choice options for `Audit.ebt_observation`):

```
signage-visible
asked-staff-accepted
asked-staff-not-accepted
not-visible
```

## 10. Out of scope — do NOT build in v1

- Promo-price / sale-price handling. Capture literal shelf price only.
- Multi-pack handling beyond the size range. If the only milk is a 2-pack of half-gallons, the volunteer flags it as "not sold" for the 1-gallon spec.
- Brand-by-brand tracking. We want generic/store brand.
- Organic vs. conventional split.
- Real-time inflation alerts.
- Volunteer rewards beyond hour credit.
- Receipt-based audits (different methodology, weaker for inflation tracking).
- AI-vs-human authorship detection on captures. Volunteers may use AI to help interpret labels — that's fine; the photos and validation already gatekeep quality.

These are legitimate future features. Don't let them creep into v1.

## 11. Definition of done (for the whole feature, end of Slice 3)

- A new volunteer can sign up, find the task in the catalog, complete an audit at a real store, and see hours credited within minutes (or the audit lands in admin queue with a clear flag reason).
- Admin can resolve flagged audits in < 60s each.
- 95th percentile audit takes < 15 min from "start a session" to submit.
- Public dashboard loads in < 2s.
- Every verified audit appears on Open Prices within 5 min.
- Vision validation cost stays under $0.01 per audit.
- All four Hard Rules in Section 3 are enforced — write a test for each.

## 12. Reference materials

- [tended-v1-task-specs.json](tended-v1-task-specs.json) — authoritative task spec (JSON form)
- [tended-food-audit-build-spec.md](tended-food-audit-build-spec.md) — rationale + tradeoffs
- USDA Thrifty Food Plan: https://www.fns.usda.gov/cnpp/usda-food-plans-cost-food-reports
- Open Prices API docs: https://prices.openfoodfacts.org/
- Federal SNAP ABAWD work requirement: https://www.fns.usda.gov/snap/ABAWD (per-state implementation varies; CA's CalFresh page is at https://www.cdss.ca.gov/calfresh as a worked example)

## 13. When in doubt

- If a design choice would require violating a Hard Rule (Section 3), stop and ask.
- If a design choice would require building something not in the slice plan, stop and ask whether to expand the slice or defer.
- If the existing Tended codebase patterns suggest a different shape than this handoff, follow the existing patterns and flag the divergence — this handoff is the spec, not the diff.
