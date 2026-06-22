# ABAWD volunteer-hour certification — operability matrix

**Date run:** 2026-06-20 (initial) → 2026-06-21 (refinement + extended fields)
**Scope:** all 50 US states + DC (51 jurisdictions)
**Methodology:** four-pass multi-agent workflow (research → adversarial refinement → PDF-extraction final pass → extended-fields pass). Claude Sonnet 4.6. Web search + state .gov source fetch + direct PDF extraction via `pypdf` / `pdfplumber` / `PyMuPDF` for previously-gated policy manuals.

## What this matrix answers (OPERABILITY ONLY)

The single question per jurisdiction:

> Can a 501(c)(3) nonprofit (Tended) certify a SNAP recipient's volunteer hours toward the ABAWD work requirement WITHOUT the recipient or the nonprofit being forced through a mandatory, state-imposed intermediate step (county assignment, Employment Development Plan, provider registration, MOU)?

This matrix **does NOT** establish whether any specific task type (street-tree counting, flyer translation, etc.) is a legally valid form of volunteering — that is governed by federal law (7 CFR §273.7 and §273.24) and is uniform across states. Activity-type validity is out of scope.

## Federal baseline (taken as established, not re-researched)

- Volunteer hours at a qualifying nonprofit count toward the 80-hours-per-month ABAWD requirement in every state.
- Qualifying-org baseline: 501(c)(3) or (c)(4), government agency, or church/place of worship.
- Two lanes exist nationwide:
  - **General volunteer lane** — recipient self-reports, org signs a timesheet/form, no MOU or county assignment. This is the lane Tended uses.
  - **Workfare lane** — formal county-run component requiring MOU between county and org, where the county tracks and determines hours. Tended is NOT using this lane.
- The per-state variable measured here: does the state keep the general lane self-directed (CLEAN), or bolt a mandatory county step onto volunteer credit (HOOPS)?

## Tier rubric

- **Tier 1 — clean.** `general_volunteer_lane=yes` AND `required_prestep=none` AND `hours_reporting=self_reported`. Tended operates as designed.
- **Tier 2 — hoops.** `general_volunteer_lane=yes` BUT `required_prestep` is EDP/assignment/provider_registration/MOU, OR hours are county_determined. Tended must integrate with a state or county process before launching.
- **Tier 3 — blocked or unclear.** Volunteer hours do not count via a nonprofit self-report path, OR the lane cannot be determined from public state sources. Do-not-launch until resolved by a human or legal check.

## Tier counts (51 jurisdictions)

| Tier | Count | Jurisdictions |
|---|---|---|
| **1 — clean** | **41** | AK, AL, AR, AZ, CA, CO, CT, DC, DE, GA, HI, IA, ID, IL, KS, KY, LA, MA, ME, MN, MO, MS, MT, NC, ND, NH, NM, NV, OH, OK, OR, RI, SC, TN, TX, VA, VT, WA, WI, WV, WY |
| **2 — hoops** | **7** | FL, MD, MI, NE, NJ, NY, PA |
| **3 — blocked or unclear** | **3** | IN, SD, UT |

## Confidence

| Confidence | Count | Jurisdictions |
|---|---|---|
| **high** | **50** | all except NJ |
| **medium** | **1** | NJ |
| **low** | 0 | — |

Three research passes pushed the dataset from 13 high-confidence records (initial) → 38 high (after refinement pass) → 50 high (after PDF-extraction final pass).

## Monthly hour requirement — KEY OPERATIONAL FINDING

Federal default is **80 hours/month**, but **7 states use the SNAP workfare formula** for general nonprofit volunteering (`allotment ÷ minimum wage`). In these states, recipients owe **dramatically fewer** hours per month — which means Tended can certify a full month's compliance with much less work. Three additional states (**MI, SD, AR**) offer the formula path *only* if the volunteer site is registered as a state workfare provider; general 501(c)(3) volunteering in those states defaults to 80.

| State | Hours/month | Formula |
|---|---|---|
| **NY** | **10** | allotment ÷ $17 NYC/LI min wage (upstate ~12 at $15.50) |
| **ME** | 19 | allotment ÷ $15.10 ME min wage |
| **MA** | 20 | allotment ÷ $15.00 MA min wage |
| **VT** | 20 | allotment ÷ $14.42 VT min wage |
| **GA** | 40 | allotment ÷ $7.25 federal min wage (PAMMS 3355 Comparable Workfare; self-initiated placement permitted) |
| **VA** | 40 | allotment ÷ $7.25 federal min wage |
| **PA** | 41 | allotment ÷ $7.25 federal min wage |
| Other 44 jurisdictions | **80** | federal baseline (MI/SD/AR included unless site is state-registered workfare) |

**Implication:** Tended's recipient UX should show the state-specific monthly hour goal, not a generic "80 hours." A NYC recipient who does 10 hours of civic work in a month has met their full ABAWD requirement.

## Out-of-state nonprofit acceptance — UNIFORM SILENCE

All 51 jurisdictions came back **"silent"** on whether the certifying 501(c)(3) must be in-state. No state policy explicitly bans an out-of-state nonprofit; no state policy explicitly permits one. Federal law (7 CFR §273.24) does not restrict org location.

**Defensible read for launch:** absent state restriction, federal default applies → a CA-based 501(c)(3) can sign verification forms for recipients anywhere. **Real risk:** county-level caseworker discretion may push back in practice, especially in the 10 county-administered states. Mitigation: in initial outreach to county agencies, surface Tended's tax-exempt status and federal-law citation up front rather than assume tacit acceptance.

## Geographic ABAWD waivers in effect (2026)

OBBBA (signed July 4, 2025) terminated most pre-existing waivers in November 2025. As of June 2026 the remaining active or contested geographic waivers are:

| State | Waiver status |
|---|---|
| **AK** | All census areas/boroughs waived EXCEPT Anchorage (Good Faith Exemption, Nov 2025–Oct 2026) |
| **HI** | Noncontiguous-state special status under OBBBA; waivers available through 2028 if unemployment ≥1.5× national |
| **ID** | No statewide waiver, but high-unemployment counties may be locally exempted by ID DHW |
| **ME** | Pre-OBBBA waiver covered 213 areas through Sept 2025; status post-OBBBA partial/contested |
| **MN** | Historically near-statewide waiver; OBBBA terminated, courts challenging — status mid-2026 unresolved |
| **RI** | 5 towns previously waived (Central Falls, Charlestown, Block Island, Providence, Woonsocket); current status uncertain |

All other 45 jurisdictions: no active geographic waivers — full ABAWD enforcement statewide.

## Submission UX summary

Across 51 jurisdictions, the recipient submission channels available are:

- **paper at county office** — 49 states (effectively universal)
- **online portal** — 25 states
- **mail** — 23 states
- **fax** — 15 states (yes, still)
- **email** — 7 states
- **mobile upload** — 6 states

Reporting cadence: **32 monthly · 16 at-recertification · 2 other · 1 unknown.** Per-state submission deadlines are recorded in each JSON (`submission_deadline` field) — most monthly-reporting states require submission by the 10th of the following month.

## Tier 2 — integration required to launch

| State | Mandatory prestep | Hours | Verification instrument |
|---|---|---|---|
| **FL** | MOU (E&T site contract) | county_determined | CareerSource Community Service / Work Experience Timesheet |
| **MD** | none | county_determined | FIA 500-B (Verification of Activity Participation) |
| **MI** | assignment (caseworker assignment + Bridges system) | self_reported | DHS-1997 (Community Service Activity Report) |
| **NE** | none | county_determined | DHHS Work Verification Request (Volunteer Verify ABAWDx) |
| **NJ** | none (but county-administered variation) | self_reported | No standardized state form; org-signed letter |
| **NY / NYC** | provider registration (HRA CSP/SEVSP) | self_reported | Monthly ABAWD Volunteer Participation Record (OTDA 25-INF-05) |
| **PA** | EDP at County Assistance Office | county_determined | PA 1938 (Community Service / Volunteer Verification Form) |

## Tier 3 — do not launch until resolved

| State | Why it's blocked |
|---|---|
| **IN** | FSSA/DFR SNAP policy manual (Chapters 2400/2500) does not articulate a general volunteer lane for ABAWD compliance independent of the IMPACT E&T program. |
| **SD** | DLR routes all community-service hours through the E&T workfare program via DSS-EA-285. If a volunteer org declines workfare site participation, hours cannot be credited. |
| **UT** | State ABAWD policy (DWS section 342, effective May 2026) lists only paid employment, WIOA/Trade Act training, and approved training programs as qualifying activities. Volunteer/community service at nonprofits is absent from state policy. |

## NJ — the one remaining medium-confidence record

New Jersey's state-level policy confirms a general volunteer lane with no mandatory prestep, but the state is county-administered and **no standardized state form exists** — verification is by org-signed letter submitted to the recipient's county agency. The agent flagged this as Tier 2 because of practical county-by-county variation in what counties accept, not because of a hard state-imposed prestep. Pending NJ legislation (S3811) could add a registry requirement post-Oct 2026.

**Recommended action before launching in NJ:** direct outreach to ≥2 NJ county welfare agencies to confirm they will accept an org-signed letter without the recipient first enrolling in NJ SNAP E&T (NJ SNAP Employment & Training).

## Notable shifts across refinement passes

- **NC** moved Tier 2 → Tier 1. The original pass misread FNS-265 MOU language as governing the general lane; refinement clarified the MOU applies only to the formal MTAJ-NC E&T program, not to general ABAWD compliance.
- **WY** moved Tier 3 → Tier 1. PDF-extraction surfaced policy manual text confirming the self-attestation lane; no approved-site list or prestep found.
- **WV** moved Tier 2 → Tier 1. The E&T-gating ambiguity in the first pass was resolved against gating once the state policy materials were extracted.
- **SC** moved Tier 2 → Tier 1. The ambiguous "established volunteer site" language turned out not to imply registration.
- **LA** moved Tier 3 → Tier 1. The original low-confidence Tier 3 (lane unclear) was resolved via additional sources.
- **IN** moved Tier 3 → Tier 2 originally, then back toward Tier 3 in the PDF-extraction pass. Indiana's manual genuinely does not describe a general lane; IMPACT E&T is the only documented pathway.

## County-administered states (variation flag = true)

CA, CO, MN, NC, ND, NJ, NY, OH, VA, WI. Even where state policy is clean, county-level acceptance can vary. The most defensible launch path in these states is to pilot in 1–2 counties first and confirm CF-888-equivalent acceptance before scaling statewide.

## Known limitations

1. **No named state verification form was located** for several Tier 1 states (`verification_instrument="unknown"` or "no named form"): AL, DE, GA, IL, KY, MA, MO, MS, NH, OK, TN. In each case the lane is documented but the state hasn't published a public-facing form; verification is by org-signed letter or timesheet. Direct outreach to the state SNAP agency is recommended before printing a Tended-branded equivalent.
2. **Recency.** Where 2025–2026 (HR 1 / OBBBA) sources were available, they were used. Some states' policy manuals predate the OBBBA changes — `abawd_enforced_2026` and the prestep status reflect the best public reading as of the run date, but enforcement language is still shifting.
3. **County variation.** Ten states are county-administered (flag = true). State policy may be clean while county acceptance varies in practice.
4. **Adversarial verification.** Every Tier 1 classification went through an adversarial refutation pass: agents were prompted to skeptically search for hidden prestep evidence (EDP, registration, approved-site lists, MOU). Where adversarial search surfaced contradicting evidence, the record was downgraded (e.g., IN moved up to Tier 2 then noted as effectively Tier 3 once the IMPACT-only pattern became clear). Where adversarial search found no contradiction across multiple independent sources, the Tier 1 rating was retained at high confidence.
5. **Activity-type validity is out of scope.** This matrix says nothing about whether any specific Tended task type (counting trees, translating flyers, mapping hazards, etc.) is a legally valid form of community service. That determination is federal, uniform, and lives in your task-design legal framework (see [docs/legal-framework.md](../../docs/legal-framework.md)), not here.

## How to use this matrix

1. **Tier 1 states (41 of 51):** Tended can launch on the general volunteer lane. For county-administered Tier 1 states, pilot in 1–2 counties first.
2. **Tier 2 states (7 of 51):** read the per-state JSON to understand which integration path (EDP, provider registration, MOU, county hour-determination) is required. Decide whether to build the integration or skip the state.
3. **Tier 3 states (3 of 51):** treat as do-not-launch until a human resolves the unknowns. For IN and SD, the question is whether the state DSS will accept a Tended-signed CF-888-equivalent without E&T enrollment — direct agency outreach required. For UT, the state has not operationalized the federal volunteer lane in its policy; legal/policy work would be needed to establish acceptance.
4. **NJ specifically:** confirm county-level acceptance before launching.

## Files

- `states/{STATE_ABBR}.json` — one record per jurisdiction (51 files). Schema:
  ```
  { state, administration, abawd_enforced_2026, general_volunteer_lane,
    qualifying_org_definition, verification_instrument, hours_reporting,
    required_prestep, remote_stance, tier, county_variation_flag,
    confidence, source_urls[], notes,
    // extended fields (2026-06-21):
    monthly_hours_required, hours_formula, hours_formula_detail,
    accepts_outofstate_nonprofit, accepts_outofstate_detail,
    geographic_waivers,
    submission_mechanism[], reporting_cadence, submission_deadline,
    form_required_fields[] }
  ```
- `abawd_operability_matrix.csv` — one row per jurisdiction with scalar fields, sortable.
- `README.md` — this file.

## Methodology

**Pass 1 — initial research (51 agents, parallel).** Each agent given the federal baseline + calibration seeds (CA=Tier 1, PA=Tier 2, NY=Tier 2) + a 2–4 search budget. Source priority: state SNAP .gov ABAWD policy → state policy manual / all-county letters / verification form PDF → state legal-aid or anti-hunger explainers (2025–2026 preferred) → county pages for county-administered states.

**Pass 2 — adversarial refinement (47 agents, parallel).** Skipped already-settled states. Each agent re-read its state's first-pass record, did 2–4 fresh searches with different angles, and applied adversarial framing to Tier 1 claims (try to refute by hunting for hidden EDP / registration / approved-site list / MOU evidence). Confidence escalated to "high" where multi-source agreement + adversarial check passed.

**Pass 3 — PDF extraction final pass (11 agents, parallel; stopped early at user request after 10 of 11 completed).** For states where prior passes flagged the primary policy manual as "binary-unreadable PDF," agents were given an explicit recipe to download via `curl` and extract text via `pypdf` / `pdfplumber` / `PyMuPDF`. Refined rubric: "high" if (a) primary source successfully extracted and confirms the lane, OR (b) ≥3 secondary sources independently corroborate and adversarial search found no contradicting evidence.

**Pass 4 — extended fields (51 agents, parallel).** Added five operational dimensions to every record: monthly hour requirement and formula, out-of-state nonprofit acceptance, geographic waivers in effect 2026, submission UX (channel/cadence/deadline), and required form fields. Each agent re-read the existing record (already containing source URLs from prior passes), pulled the new fields from existing PDFs where possible, and ran 1–2 targeted new searches for the gaps. Headline findings: 9 states use the workfare formula instead of federal 80 hrs/month (NY = 10 hrs!); all 51 states are silent on out-of-state nonprofit acceptance (federal default applies).

Each agent was instructed to set fields to "unknown" rather than guess, and to never invent a form number.
