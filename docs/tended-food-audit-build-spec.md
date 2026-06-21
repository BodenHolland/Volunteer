# Food Access Price Audit — build spec

What we need to ship to support the `food-access-price-audit` task. Organized by what's reusable platform infrastructure vs. what's task-specific config vs. what's an integration.

The guiding constraint: every new task should be a **config change, not a build.** That mostly holds here. There are two genuinely new platform features required (repeat-group primitive + photo vision validation) that this task forces us to build — but both will be reused by every future audit-style task, so the investment pays off across the catalog.

---

## 1. Platform features required

### 1a. NEW PRIMITIVE: `repeat-group`

The basket loop ("for each of 6 items, do this sub-flow") doesn't fit any existing primitive. Add one:

```
repeat-group:
  target: <human label for the loop, e.g. "6 basket items">
  items: [<list from task config>]
  sub_steps: [<ordered list of primitives applied to each item>]
  captures: per-iteration sub-step results
  branch: per-iteration conditional logic (e.g., if OOS, skip photo+price)
```

**Why it's worth adding:** every audit-style task we've discussed (food, public-service experience, transit observations, accessibility) has a "for each [thing], capture [sub-form]" pattern. Without this primitive, configs would explode into 6× repetition for the basket, and any future "for each X" task would need bespoke screens.

**Implementation:** the session-engine component already renders an ordered list of step primitives. `repeat-group` is a meta-primitive that wraps a sub-list of primitives and iterates over a config-provided array. Renders as a vertical stack of item cards, each one running the sub-flow.

### 1b. NEW: Photo vision validation service

For each in-stock item photo, run one vision-model call that returns:

```
{
  "contains_price_tag": bool,
  "tag_is_readable": bool,
  "ocr_price_value": float | null,
  "contains_item": bool,
  "item_category_match": "milk" | "eggs" | "bread" | "rice" | "beans" | "produce" | "unknown",
  "confidence": float
}
```

**Why it's needed:** photo + price + size capture without vision verification is trust-only. The whole point of capturing a photo is to enable cross-check against the entered price. Without this service, photo capture is theater.

**Implementation:** single API call per submitted item. Use Claude Haiku (vision) or GPT-4o-mini — both cheap (~$0.001/image). Async pipeline: submission lands → enqueue 6 vision checks → results merge into validation rubric → flag for spot-review if mismatch.

**Cost ballpark:** ~$0.006 per audit × 10,000 audits/month = $60/mo. Negligible.

### 1c. EXISTING primitives that need confirmed implementation

These are already in the v1 primitive set but the food audit forces us to confirm they're built properly:

- **`confirm-location`** must support: pick from POI suggestions, drop pin fallback, "store not listed" branch with name+address capture
- **`photo`** must capture: image, geocode (device GPS), EXIF timestamp, and submit to vision validation pipeline
- **`multi-choice`** must support: single-select, multi-select, and nested branching (e.g., "if in-stock → reveal next sub-steps")
- **`short-text`** must support: numeric-only mode with $ prefix or unit suffix, length-bounded

---

## 2. Task-specific config (write once, never code)

These live in JSON in the task config — no engineering needed beyond the platform features above.

### 2a. Basket catalog config

```json
{
  "basket_id": "usda-thrifty-6",
  "version": "2026.1",
  "items": [
    {
      "id": "milk-gallon",
      "display_name": "Milk",
      "spec": "1 gallon, whole, generic/store brand",
      "expected_size_range": {"min": 1, "max": 1, "unit": "gal"},
      "category": "dairy",
      "plausibility_band_usd": {"low": 2.50, "high": 12.00}
    },
    {
      "id": "eggs-dozen",
      "display_name": "Eggs",
      "spec": "1 dozen, large, Grade A, generic/store brand",
      "expected_size_range": {"min": 12, "max": 12, "unit": "count"},
      "category": "eggs",
      "plausibility_band_usd": {"low": 1.50, "high": 15.00}
    },
    {
      "id": "bread-loaf",
      "display_name": "Bread",
      "spec": "1 standard loaf (16-20 oz), sliced white or whole wheat",
      "expected_size_range": {"min": 16, "max": 20, "unit": "oz"},
      "category": "bread",
      "plausibility_band_usd": {"low": 1.00, "high": 10.00}
    },
    {
      "id": "rice-1lb",
      "display_name": "Rice",
      "spec": "1 lb bag, standard white long-grain",
      "expected_size_range": {"min": 1, "max": 1, "unit": "lb"},
      "category": "rice",
      "plausibility_band_usd": {"low": 0.50, "high": 6.00}
    },
    {
      "id": "beans-can",
      "display_name": "Canned beans",
      "spec": "1 standard can (15-16 oz), black or pinto",
      "expected_size_range": {"min": 15, "max": 16, "unit": "oz"},
      "category": "beans",
      "plausibility_band_usd": {"low": 0.50, "high": 5.00}
    },
    {
      "id": "produce-banana-or-apple",
      "display_name": "Fresh produce (bananas or apples)",
      "spec": "Bananas or apples, per pound or per single unit",
      "category": "produce",
      "size_capture": "flexible",
      "unit_options": ["lb", "count"],
      "plausibility_band_usd_per_lb": {"low": 0.30, "high": 5.00},
      "plausibility_band_usd_per_unit": {"low": 0.15, "high": 3.00}
    }
  ]
}
```

Plausibility bands are intentionally wide for v1 — they tighten automatically as the dataset grows (see 3b).

### 2b. Store-type taxonomy

```
chain supermarket           // Safeway, Kroger, Albertsons, etc.
independent grocery         // local non-chain
corner store / bodega
ethnic market               // Asian, Latino, Halal, etc.
farmers market
dollar store / general      // Dollar Tree, 99 Cents Only
other
```

Stratification matters because the "universally stocked" assumption breaks down for bodegas and dollar stores. We need per-store-type plausibility bands and per-store-type basket-completeness expectations, not a single CA-wide expectation.

---

## 3. Validation pipeline

### 3a. Per-submission gates (synchronous)

Run at submission time, block on failure:

- All 6 basket items have a stock-status result
- For every "in stock" item: photo + price + size + unit all present
- Geocode is in the continental US (lat 24.5–49.5, lng -125.0 to -66.5) AND within ~100 miles of the volunteer's registered home state
- Session time within 4–25 min band (calibration band starts wide, tightens with data)
- Anti-dup: no prior submission by same volunteer for same store in last 7 days

### 3b. Async validation (per-item, photo + price)

After submission lands:

1. Enqueue one vision-model call per in-stock item photo
2. For each, check: tag present, item present, OCR price within ±10% of entered price, item category matches expected
3. Compute price plausibility: is entered price within `[item.band.low, item.band.high]` AND within `±3σ` of running median for (item × store_type × region)? (the running-median calculation lives in the aggregation pipeline; this just reads it)
4. If any check fails → flag for spot-review queue (don't auto-reject)

### 3c. Aggregate outlier flagging (batch, runs hourly)

Monitor for:
- Volunteers whose submissions consistently OCR-disagree (training-data poisoning, low photo quality, or bad faith — needs human disambiguation)
- Stores where submissions are systematically inconsistent across volunteers (suspicious of store-impersonation or a frequently-changing store)
- Geographic clusters where the basket cost is anomalous (could be a real food desert finding, or could be coordinated bad data)

### 3d. Contributor trust weighting

- First 3 audits: tighter photo-validation tolerance, all submissions sampled for spot-review
- After 10 audits with consistent photo+OCR agreement: trust tier 1, sampling rate drops to 10%
- After 30 audits at tier 1: trust tier 2, sampling rate drops to 3%
- Any 2 failed audits in a 30-day window: revert to tier 0

---

## 4. Output pipeline

### 4a. Internal: aggregation for the Community Food Access Report (stratified by state + metro)

Daily batch job computes:
- Per-store: median basket cost, item-level prices, last-audited date
- Per-zip code: median basket cost, OOS rates by item, store-type mix
- Per-county: same plus rolling 28-day trend
- Statewide: median basket cost, item inflation, OOS-rate trend
- Inequality metrics: basket-cost gap between dollar stores and chain supermarkets, between high-SNAP and low-SNAP zip codes

Output: a public dashboard + monthly PDF report + open dataset download (CSV + GeoJSON).

### 4b. External: Open Prices API contribution

For each validated in-stock item, format and POST to Open Prices:
- Endpoint: `https://prices.openfoodfacts.org/api/v1/prices`
- Required fields: product (mapped from basket-item to OFF product code), price, currency, location, date, proof image (the photo)
- Mark with project tag: `tended-ca-food-access`
- One contribution = one item; one audit = up to 6 contributions

This needs:
- A mapping table from our basket items to Open Food Facts product codes (one-time setup, ~6 entries — though produce will need per-region SKU lookup)
- An OFF account (auth token in env)
- A retry queue for failed POSTs

**Why this matters:** contributing to Open Prices makes the dataset reusable by researchers worldwide and increases the public-benefit framing of the volunteer work. It also gives us free data validation — divergence from other Open Prices contributors in the same area is another outlier signal.

---

## 5. Out of scope for v1 (do not build)

- Promo-price / sale handling (we capture literal shelf price, on purpose)
- Multi-pack tracking, brand-by-brand tracking, organic vs. conventional split
- Real-time inflation alerts to volunteers or agencies
- Volunteer-facing rewards or gamification beyond the standard hour credit
- Store-employee verification or manager-approved audits
- Receipt-based audits (different methodology, weaker for inflation tracking)

These are real future features. Don't let them block v1.

---

## 6. Build estimate (rough)

| Component | Status | Effort |
|---|---|---|
| Session-engine `repeat-group` primitive | NEW | ~2 days |
| Photo vision validation service | NEW | ~3 days |
| Basket config schema + this task's config | NEW | ~0.5 day |
| Store-type taxonomy + multi-choice handling | EXISTING + config | ~0.5 day |
| Per-submission gates | EXISTING (extend) | ~1 day |
| Aggregation pipeline (daily batch) | NEW | ~3 days |
| Open Prices API contribution | NEW | ~2 days |
| Spot-review queue UI | EXISTING (shared) | 0 incremental |
| Trust-weighting logic | EXISTING (shared) | 0 incremental |
| **Total** | | **~12 days** |

About half of this (vision validation, repeat-group, trust weighting if not yet built) is shared infrastructure that every subsequent audit task gets for free.

---

## 7. Build order recommendation

Ship in three slices so we can validate at each step:

**Slice 1 — local capture works end-to-end (no Open Prices, no aggregation)**
- `repeat-group` primitive
- Basket config
- Per-submission gates
- Photo capture with EXIF
- Spot-review queue
- → Volunteers can submit, admins can review, but data sits in the DB

**Slice 2 — automated validation + public dashboard**
- Photo vision validation service
- Aggregation pipeline
- Public dashboard for the Community Food Access Report (per-state and per-metro views)
- → Data validates itself, public sees the dataset

**Slice 3 — Open Prices contribution**
- OFF product mapping
- Open Prices API client + retry queue
- Mark contributions with `tended-ca-food-access`
- → Global reuse, additional validation signal
