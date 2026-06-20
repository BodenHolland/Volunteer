# Tended — Legal & Program Framework

Revised after independent legal stress-test. This document is the canonical
statement of what Tended is, why it is lawful, and the rules every part of the
product must obey. Where this document and the code/marketing copy ever
disagree, **this document wins** and the code is the bug.

---

## The two hard lines (non-negotiable)

1. **Never credit hours above the volunteer's actual measured time.** The CF 888
   attests to hours a *specific person* worked. Crediting less than actual is
   safe; crediting more is false attestation and felony-adjacent.
2. **Never ship a task that is self-serving busywork rather than service to an
   external beneficiary.** A task that benefits only the person doing it is not
   charitable volunteer work — it is a research subject or a microtask gig.

Everything below exists to keep these two lines true.

---

## What Tended is

Tended is a **501(c)(3) virtual volunteer coordinating organization**. Its
charitable purpose is to mobilize remote volunteers to produce **free
public-benefit civic outputs** — translations and plain-language versions of
public information, civic data collected for city agencies, transcriptions of
public archives, neighborhood documentation donated to libraries and government.

A Tended volunteer is **legally indistinguishable from a food-bank volunteer**
meeting the same CalFresh ABAWD work requirement. That equivalence — not a novel
theory — is the entire legal basis. CF 888 was built for exactly this.

Remote, massively-parallel nonprofit volunteering is established and accepted.
Tended is squarely in the lineage of:

- **Smithsonian Transcription Center** — volunteers transcribe collections online.
- **Library of Congress "By the People"** — crowdsourced transcription of public records.
- **Zooniverse** — volunteers do real research-grade data tasks at scale.
- **Tarjimly** — remote volunteer translators for refugees and aid orgs.

None of these sell their volunteers' output. Neither does Tended.

---

## The SNAP mechanism (sound core)

The counting mechanism is solid and unchanged:

- **Authority to count unpaid volunteer hours toward the ABAWD requirement:**
  **7 CFR §273.24(a)(2)(iii)** (qualifying activity), as implemented in
  California by **CDSS ACL 25-34**.
- **Verification instrument:** **Form CF 888** — Section 1 by the recipient,
  Section 2 by the sponsoring nonprofit.
- **Enforcement timing:** California enforces the expanded ABAWD rules from
  **June 1, 2026**.

Pipeline: volunteer performs genuine charitable work → Tended records *measured*
hours → sponsoring nonprofit reviews quality and signs Section 2 → recipient
downloads the pre-filled CF 888 and uploads it to BenefitsCal themselves →
**the County**, not Tended, decides eligibility.

### Citation discipline (apply everywhere)

- ✅ Use **7 CFR §273.24(a)(2)(iii) + CDSS ACL 25-34** as the unpaid-work authority.
- ❌ Do **not** cite **7 CFR §273.7** as that authority — it is general work
  requirements / E&T, not the ABAWD unpaid-volunteer counting rule.
- ❌ Do **not** cite **29 CFR §553.101** for volunteer status — it governs
  *public-agency* volunteers only, not private 501(c)(3)s. Use the general FLSA
  nonprofit-volunteer framework instead (DOL: individuals who volunteer for
  charitable/civic/humanitarian reasons for a nonprofit, without promise or
  expectation of compensation, are not employees), read against
  *Tony & Susan Alamo Foundation v. Secretary of Labor*, 471 U.S. 290 (1985).
- ☑️ **CF 888 Section 2 attestation wording — VERIFIED** from the official CDSS
  English form (CF 888, rev. 5/25): *"For the month of ___, I certify that the
  person named above volunteered or performed community service for the
  organization I represent for ___ hours. The volunteer activity is: ☐ Ongoing
  ☐ One Time."* This attests to a **specific person's actual hours** — which is
  why hard line #1 exists. All crediting logic conforms to this wording.

---

## 1. Funding: 100% grant- and donation-funded. No data sales. Ever.

Tended takes **no revenue from the work product** of its volunteers. Volunteer
outputs are distributed **free** to the public, libraries, and government. Tended
**never sells** aggregated data, de-identified datasets, or commissioned research.
Operations are funded **only** by grants and donations.

**Why this is the single most important change.** Selling the work product of
people you call "volunteers" creates a textbook employee-misclassification case.
In *Tony & Susan Alamo Foundation* (471 U.S. 290), workers who called themselves
volunteers were held to be FLSA **employees** because the *economic reality* was
that they staffed the organization's **commercial** operations in exchange for
benefits. Selling volunteer output would also trigger **UBIT** and the
**commerciality doctrine**, threatening 501(c)(3) status. Removing all sales
collapses the misclassification, UBIT, and exemption risks simultaneously.

---

## 2. Entity & positioning

Tended is presented and operated as a charitable volunteer-coordinating nonprofit
(see "What Tended is"), explicitly analogized to the established remote-volunteer
nonprofits above. We do **not** ask any regulator to bless a monetization theory;
we ask only that they treat a remote charitable volunteer the same as an in-person
one — which the CF 888 framework already does.

---

## 3. Task design: the 4-part beneficiary gate

**No task ships unless it passes all four:**

| Gate | Requirement |
|---|---|
| (a) External beneficiary | A third party / the community benefits — not just the volunteer. |
| (b) Genuine need | The sponsoring org actually needs the work done. |
| (c) Free public deliverable | The output is given away to the public, a library, or government. |
| (d) Would-do-anyway | The kind of work a volunteer would do even without the SNAP overlay. |

**Prioritized task types:** translation / plain-language QA for limited-English
(LEP) residents; civic data collection routed to city agencies; public-archive
transcription.

**Reframing rule.** Any "write about your own experience" or pure-learning task is
**reframed into a contribution to a public good** — e.g., an oral-history entry
**donated to a library**, or a resource guide that helps **other** residents. A
self-reflection that benefits only its author fails gate (a) and does not ship.

> Example correction: a "financial literacy seminar + personal workbook" task is
> self-serving as drafted (benefits only the learner). It only ships if it
> produces a **free public deliverable** — e.g., a one-page plain-language
> money-help guide donated to a partner library for other residents to use.

The `tended-task-designer` reference encodes the per-task qualification test; every
template must pass this gate before `status = 'active'`.

---

## 4. Hours & time logic (most important mechanical change)

**Credited hours are the volunteer's measured work, never a task estimate.**

```
credited_hours = min(measured_active_engagement, calibrated_cap)
                 — and only if the work passes quality review; else 0.
```

- **Measured active engagement** is the source of truth: an active-session timer
  with idle detection and minimum-engagement floors (work cannot be submitted
  before genuine engagement). This is the real defensibility layer.
- **The AI/task time estimate is a CEILING and an OUTLIER FLAG only.** It is
  **never** the credited number, and it may only ever pull a credited number
  **down**, never up.
- **A reviewer may reduce hours for quality; a reviewer may never increase them
  above measured time.** Rejected or low-effort work earns **zero** hours.

**Why.** The CF 888 attests to the hours a *specific person* actually worked
(verified wording above), not the standardized value of a task. Crediting 3 hours
because a model predicted 3 when the person worked 40 minutes makes the
attestation **false as to that person** — exposure under **7 U.S.C. §2024**
(SNAP fraud), **18 U.S.C. §1001** (false statements), and **Cal. Welf. & Inst.
Code §10980** (CalFresh fraud). Under-crediting is safe; over-crediting is the
felony-adjacent risk. The defensibility comes from *verified engagement*, not AI
prediction.

---

## 5. Estimate / cap methodology

The per-task **cap** is built in two steps and written down:

1. **Seed** with AI task-decomposition — reading load, exercise complexity,
   expected output length — to get a first-pass estimate.
2. **Calibrate** that estimate to the **observed median of real, quality-passing
   human sessions**. The cap is the calibrated value, not the AI guess.

The methodology is documented and **recalibrated quarterly**. An uncalibrated AI
number is just a guess; a cap validated against thousands of real completion times
is a defensible standard — **this written methodology is the audit defense.**

---

## 6. Entity, filing & governance

- **Form 1023, not 1023-EZ**, if Tended will raise **> $50k/year**. The 1023-EZ
  requires attesting that gross receipts will **not** exceed $50k in any of the
  next three years; that attestation would be false for a funded org and would
  invalidate the determination.
- Adopt an **IRS-style conflict-of-interest policy**.
- **Insulate the CF 888 certification function from every growth/fundraising
  metric.** Tended both runs the platform and facilitates certification, so the
  certification path must be **visibly independent** of any incentive to inflate
  volume. Certification decisions and the verification methodology are governed
  separately from product/fundraising goals.

---

## 7. Volunteer-status hygiene (state explicitly, everywhere)

- Volunteers receive **zero compensation, stipends, or anything of value** from
  Tended. The **only** benefit is *independent* State SNAP eligibility, decided by
  the County.
- Volunteers **do not displace paid staff** and are not integral to any commercial
  business (there is none).
- **"Tended records hours; the County decides eligibility."**

This keeps the **FLSA** analysis and the **California ABC test** (Lab. Code §2775)
defused: no payment flows from Tended, and there is no commercial enterprise the
volunteers could be economically integral to.

---

## 8. Identity basis & regulatory pre-clearance

- **One verified account per person.** Controls against a single person farming
  multiple case numbers, so logged work ties to one identified beneficiary. The
  CF 888 case number is the bridge to identity (the State already verified
  enrollment); Tended's job is account continuity and accurate Section 1 capture —
  **not KYC**. Never use ID.me, facial recognition, selfie + ID, SSNs, or credit
  checks.
- **Get it in writing before scaling.** There is currently **no** CDSS or county
  guidance on remote / online / AI-validated volunteer hours. Silence is not
  permission. Obtain **written confirmation from CDSS or a pilot County Welfare
  Department** that the remote/online model qualifies, and **pilot in 1–2 counties**
  before scaling into the interpretive gap.

---

## Status of this build vs. this framework

The demo implements the sound core (volunteer tasks → measured time → nonprofit
review → CF 888) and now the corrected hours logic (Change 4). Items that are
**policy/legal commitments rather than code** — funding model, Form 1023,
conflict-of-interest policy, CDSS/county written pre-clearance, quarterly cap
recalibration — are documented here as the operating rules and are out of scope
for the software demo. See [CLAUDE.md](../CLAUDE.md) for how the code reflects them.
