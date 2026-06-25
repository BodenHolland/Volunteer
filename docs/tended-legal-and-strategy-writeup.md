# colift — Concept, Legal Grounding, and Go-to-Market Strategy

**Status:** Working strategy document (not legal advice) — Revision 5
**Date:** June 19, 2026
**Prepared as:** Synthesis of the legal stress-test, redesign, and pre-launch findings for the colift concept

> **Read me first.** This document folds together (a) the idea, (b) its legal foundation and the authorities that support it, (c) the risks that sank the original version and how the redesign neutralizes them, (d) the funding structure that keeps the charity safe, and (e) a rollout strategy realistically likely to succeed. It is an internal strategy memo, not legal advice. Items I could not verify against a primary source are marked **[UNVERIFIED]**. Before relying on anything here, confirm the flagged items and have counsel review.

---

## 1. Executive summary

**The idea:** colift is a web platform that lets California residents complete short, low-tech civic/charitable volunteer tasks online, logs the time they spend, and — for residents who must meet the CalFresh ABAWD work requirement — verifies those hours on California's **CF 888** form so they count toward the **80-hours-per-month** requirement.

**The legal core is sound.** Federal law expressly lets unpaid volunteer work count toward the ABAWD requirement when verified under a state standard (**7 CFR §273.24(a)(2)(iii)**), and California created exactly such a standard in 2025 (**CDSS ACL 25-34** and the **CF 888 Volunteer Work Hour Verification Form**). A properly structured colift volunteer is legally indistinguishable from a food-bank volunteer meeting the same requirement.

**Two design decisions define the model and keep it on solid ground.** (1) colift is **funded by grants and donations and distributes its outputs free** rather than selling the volunteers' work product — which keeps volunteers clearly volunteers and avoids the employee-status analysis of *Tony & Susan Alamo Foundation v. Secretary of Labor*, 471 U.S. 290 (1985). (2) colift **certifies measured actual hours, never task estimates** (a calibrated cap bounds each credit — §5.3) — which keeps every CF 888 a true statement. §4 sets out each decision and the variables weighed.

The result: colift sits on the side of the line California already approved — a bona-fide volunteer organization whose participants meet the ABAWD requirement the same way a food-bank volunteer does.

**Two disciplines keep the model clean:** **certify actual hours only** (the CF 888's certification is light, but knowingly inflated hours are still fraud — §3.2), and keep the **certification function independent of funders** (corporate and other support is welcome; what's avoided is funding *conditioned on* enrollment or certification outcomes — §6).

On approvals and rollout: no agency pre-approval is legally required, and there is no adverse precedent, but acceptance of the forms is discretionary at the county level and subject to appeal. The approach is to pilot small, optionally pre-clear with a county, and scale deliberately. The verification records serve as both audit defense and the evidence a recipient needs to win a benefits appeal.

---

## 2. The idea

colift is a **virtual volunteer and civic-participation organization** — a 501(c)(3) with a charitable *and* educational purpose that mobilizes remote volunteers to produce free, public-benefit civic and educational outputs. It runs on a simple loop:

1. **Tasks.** Short, massively-parallel, low-tech civic tasks — e.g., reviewing/correcting AI-generated translations or plain-language rewrites for limited-English residents; light civic data collection (sidewalk-hazard photos, tree census, EBT-acceptance audits) routed to a city agency; transcription for public archives; contributions to free community resource guides and oral-history collections.
2. **Performance.** Any California resident can complete tasks. Volunteers receive nothing of value from colift.
3. **Hours logging.** The platform measures active engagement; the volunteer self-reports and attests to their time.
4. **Validation.** Automated checks validate each submission — engagement measurement, a deliverable-present/usability check, and PII screening; submissions outside normal bounds are flagged for human spot-review; work with no genuine deliverable earns zero hours (§5.11).
5. **Verification.** For volunteers subject to the ABAWD work requirement, colift generates a pre-filled **CF 888**, and an authorized representative signs Section 2 attesting to the organization and the **actual verified hours**. The volunteer uploads it to BenefitsCal as proof toward the 80-hour requirement.

**Outputs are distributed free** (never sold) to mission-aligned recipients — the commissioning agency, partner organizations, or the community served. Distribution need not be fully public: access can be controlled to protect privacy, and submissions are screened for personal information before release (§5.12). colift is funded entirely by grants and donations and **does not sell** data, deliverables, or research.

The design intent: a permissionless, scalable way for benefit recipients to meet a work requirement through genuine community service that also produces real public goods.

---

## 3. Legal grounding

### 3.1 The federal hook — unpaid volunteer work can count

The ABAWD time limit and work requirement live at **7 CFR §273.24** (not §273.7, which is the general work-registration/E&T/workfare provision). Under **§273.24(a)(1)**, a person fulfills the requirement by working 80 hours/month, participating in a work program, a combination, or workfare. Critically, **§273.24(a)(2)** defines "working" to include:

> "(i) Work in exchange for money; (ii) Work in exchange for goods or services ('in kind' work); or **(iii) Unpaid work, verified under standards established by the State agency.**"

That third prong is the entire foundation. Note what it is **not**: nonprofit volunteering is **not** an enumerated "work program" under §273.24(a)(3) (those are WIOA, Trade Act, E&T, veterans programs). colift qualifies **only** through the unpaid-work prong — which means it lives or dies on the **State verification standard**.

### 3.2 The California standard — ACL 25-34 and CF 888 (verified)

California supplied that standard. Via **All-County Letter (ACL) 25-34 (issued May 14, 2025)**, CDSS released the **CF 888 — CalFresh ABAWD Volunteer Work Hours Verification Form** (rev. 5/25). Under the framework:

- An ABAWD may satisfy the requirement through **community service or volunteer work**, alone or combined with other qualifying activities.
- Hours must be **verified**. The CF 888 is one accepted vehicle; the county may alternatively accept the **verbal statement** of an authorized representative of the organization.

**CF 888 Section 2 — exact wording (verified against the English form, rev. 5/25).** The entire certification reads:

> *"For the month of ______, I certify that the person named above volunteered or performed community service for the organization I represent for ______ hours. The volunteer activity is: ☐ Ongoing ☐ One Time"* — followed by Signature of Representative / Date Signed.

Key facts about the form:

- **No penalty-of-perjury clause** is printed — it says only "I certify." (Knowingly false hours still carry fraud exposure under 18 U.S.C. §1001 and Cal. Welf. & Inst. Code §10980, independent of any jurat.)
- **No observation or supervision requirement.** The signer is simply "a representative of the organization where the person volunteers." An AI-rubric + human-review basis is sufficient.
- **The certified value is actual "hours [the person] volunteered or performed"** — not a task estimate. This is the discipline that governs crediting.
- **No EIN field** — a correction to the original concept, which assumed the form captures the EIN. Fields are: organization name, representative name, address, phone, month, hours, ongoing/one-time, signature, date.
- **"Required Form — No Substitutes Permitted."** colift may *pre-fill the official CF 888* but may **not** issue its own substitute verification form.

**Crediting rule to conform to:** `certified hours = actual volunteered hours` (= the `min(measured engagement, calibrated cap)` figure from §5.3). The form's formal bar is low; your internal discipline is what keeps it honest.

### 3.3 The "volunteer work" must be bona fide

The framework assumes a genuine volunteer relationship with a qualifying organization (published examples: food pantries, libraries, religious/community orgs, Red Cross, Goodwill). Two things make volunteer work "bona fide":

- It is **service to a third party / the community**, not solely self-serving busywork.
- The volunteer receives **no compensation** from the organization. The SNAP benefit is an **independent State entitlement**, not payment from colift — exactly as it is for a food-bank volunteer.

### 3.4 The current ABAWD landscape (why this is urgent)

The **One Big Beautiful Bill Act (H.R. 1, 2025)** expanded ABAWD work requirements: the age range rose from 18–54 to **18–64**, the dependent-care exemption narrowed (children under 14 only), and exemptions for veterans, people experiencing homelessness, and former foster youth were eliminated. California began enforcing the time limit broadly in 2026. The result is a large population newly subject to the 80-hour requirement and actively seeking qualifying-hours options — the demand colift addresses.

---

## 4. Key design decisions and the variables considered

The eligibility core (§3) is sound. Four design choices determine whether the model stays on the right side of the law. For each: the decision, the variables weighed, and why we landed where we did.

### 4.1 Decision: distribute outputs free; do not sell the work product

**Decision:** outputs are given away to the public, libraries, or government; colift does not sell the volunteers' work product. **Variables weighed:** a sales-funded model would place unpaid volunteers' labor inside a revenue-generating operation — the fact pattern of ***Tony & Susan Alamo Foundation v. Secretary of Labor*, 471 U.S. 290 (1985)**, where workers who considered themselves volunteers were held to be FLSA **employees** under the "economic reality" test because their labor fed the organization's **commercial** activity. California's **ABC test** (Labor Code §2775; *Dynamex Operations West v. Superior Court*, 4 Cal.5th 903 (2018)) would compound it with minimum-wage, overtime, and **PAGA** exposure. **Why we landed here:** giving outputs away removes the commercial enterprise, so there is no business the volunteers are "integral" to — the volunteer characterization holds and the misclassification analysis falls away. The trade-off (foregoing earned revenue) is handled by the funding strategy in §6.

### 4.2 Decision: certify measured actual hours, not task estimates

**Decision:** the certified number is measured engagement, with the AI estimate serving only as a calibrated ceiling (§5.3) — never a flat estimate credited regardless of time spent. **Variables weighed:** the CF 888 certifies hours **a specific person actually worked**; crediting a flat "3 hours" to someone who finished in 40 minutes would be a false statement on a government benefit form (exposure under **7 U.S.C. §2024**, **18 U.S.C. §1001**, **Cal. Welf. & Inst. Code §10980**). A pure-estimate model is simpler to build but puts every certification at risk. **Why we landed here:** measuring actual engagement keeps each CF 888 true and turns the records into both audit defense and the evidence a recipient needs on appeal (§8).

### 4.3 Decision: fund via grants and donations, not data sales

**Decision:** the platform is funded philanthropically; aggregated data and analysis are not sold as a commercial line. **Variables weighed:** fee-for-service data sales would likely be **unrelated business income** (IRC §§511–513) and, if they became the funding engine, would threaten exempt status under the **commerciality doctrine** (*Better Business Bureau v. United States*, 326 U.S. 279 (1945); *United Cancer Council v. Commissioner*, 165 F.3d 1173 (7th Cir. 1999)). **Why we landed here:** philanthropic funding keeps the organization plainly charitable and removes the UBIT/commerciality question entirely. The funding model is detailed in §6.

### 4.4 Decision: full Form 1023 and conflict-of-interest governance

**Decision:** file the full **Form 1023** (not 1023-EZ) and adopt board-level conflict-of-interest governance over the certification function. **Variables weighed:** an organization projecting >$50k in gross receipts in any of its next three years **may not use Form 1023-EZ** (IRS 1023-EZ eligibility worksheet), and colift's dual role as platform *and* certifier is a structural conflict that governance must address. **Why we landed here:** the full 1023 matches the real revenue trajectory (§5.1), and an insulated certification function (§5.5, §6) keeps verification demonstrably independent of fundraising and growth incentives.

### 4.5 Citation precision (carry these everywhere)

- ABAWD unpaid-work authority is **7 CFR §273.24(a)(2)(iii) + CDSS ACL 25-34** — **not** 7 CFR §273.7.
- **Do not** cite **29 CFR §553.101** to establish volunteer status — it governs **public-agency** volunteers only, not private 501(c)(3)s. Use the general FLSA nonprofit-volunteer framework instead.
- The CF 888 has **no EIN field** and **no perjury jurat** (§3.2).

---

## 5. The operating model

Core mechanism: a platform hosts massively-parallel, low-tech civic volunteer tasks; ABAWD recipients perform them as genuine volunteers; **verified actual hours** generate a CF 888 that counts toward the 80-hour requirement.

### 5.1 Entity, purpose, and filing

A 501(c)(3) **virtual volunteer and civic-participation organization** with a **charitable *and* educational** purpose: mobilizing remote volunteers to produce free public-benefit civic and educational outputs, and building civic capacity, public knowledge, and educational resources for the communities it serves. The broad charitable-and-educational mandate is deliberate future-proofing — it lets the organization grow into civic-literacy materials, plain-language public education, and volunteer-produced learning resources without amending its articles. Anchor it to established, already-remote nonprofit precedents — **Smithsonian Transcription Center**, **Library of Congress "By the People,"** **Zooniverse**, **Tarjimly** — which prove remote, massively-parallel nonprofit volunteering is legitimate and accepted.

> **Drafting caution — keep the stated purpose mission-level, never benefit-level.** The articles, Form 1023 narrative, website, and grant materials must describe the organization's purpose as its **charitable and educational mission and the public goods it produces** (civic participation, community knowledge, public education). They must **never** frame the purpose as helping participants *retain public benefits.* Benefit retention is an *incidental effect for individual participants*, not the organization's purpose. Stating it as the purpose (a) is not itself a 501(c)(3) exempt purpose, (b) reinforces the "scheme to satisfy a work requirement" narrative an auditor is primed to look for, and (c) compounds the private-benefit exposure in §6. This applies to public-facing copy as much as to legal filings.

**File the full Form 1023, not 1023-EZ.** Your funding strategy will predictably exceed the EZ ceilings (>$50k projected gross receipts in any of the next 3 years; >$250k assets), so the EZ attestation would be false at filing.

- **There is no "EZ now, full 1023 later" upgrade path.** A determination letter is the determination; you never re-apply for exemption because you grew. A genuinely small org that later crosses $50k simply switches its annual return from the **990-N** postcard to **Form 990** — it does not re-file an application.
- **Cost is one-time, not annual.** IRS application fee: **$600** (full 1023) vs. $275 (EZ) — a one-time delta of ~$325. Optional professional prep (attorney/CPA) runs **~$2,500–$5,000** one-time; self-preparation is possible. There is **no annual IRS exemption fee.**
- **Recurring obligations are cheap and size-driven, identical regardless of which form you filed:** annual **Form 990/990-EZ/990-N** (free to file; *missing it 3 years running auto-revokes exemption*); California **FTB Form 199**, **AG Form RRF-1** (tiered ~$25–$75+), and the biennial **Statement of Information** (~$20).

Adopt a board, an **IRS-style conflict-of-interest policy**, and oversight of the certification function. *(Confirm current fee figures before filing.)*

### 5.2 Task design: the gate and the priority order

Every task must pass four tests before it ships:

1. **External beneficiary** — a third party or the community, not just the volunteer.
2. **Genuine need** — the organization or a partner agency actually needs the output.
3. **Free public deliverable** — published or donated, never sold.
4. **Verifiable output** — the work produces a reviewable artifact, so the hours can be supported if questioned.

Among tasks that pass the gate, prioritize in this order (most defensible first):

- **Tier 1 — Agency-commissioned tasks.** A city, county, or public agency posts the task, states the need, and uses the result. This produces the strongest version of every gate criterion and anchors legitimacy outside colift. This is the direction to build toward. Agency sponsorship establishes the *task's* legitimacy; it does not remove the requirement to measure actual hours or to keep the deliverable verifiable.
- **Tier 2 — Data collection and information production with a self-verifying deliverable.** Geotagged hazard photos with metadata, EBT-acceptance audits, translation and plain-language QA, archive transcription. The artifact is its own proof, quality-gates cleanly, and is straightforward to support in an audit.
- **Tier 3 — Qualitative tasks that produce a real, used artifact.** Community conversations or interviews qualify only when they yield structured output that feeds a published needs assessment, oral history, or resource guide that is reviewed and used — not a free-form "we talked to people" with no reviewable product.

Do not build:

- **Passive time tasks** — "open a task, start a timer, read a document, get credited for the elapsed time." Reading is consumption, not service, and an unatcolift timer measures nothing.
- **Content sized to manufacture hours** — documents whose only function is to extend credited reading time. Credited time tracks genuine effort on a deliverable, not page count.
- **Deliberately unverifiable tasks** — work designed so the claim cannot be checked. A task that cannot be verified is a CF 888 that cannot be supported; certifying it is the false-attestation exposure in §4.2.

Reading time counts only as necessary, proportionate preparation for a deliverable (§5.9), never as the activity itself.

### 5.3 Hours engine

```
credited_hours = min( measured_active_engagement , calibrated_cap )
                 — gated on deliverable passing quality review
```

- **Measured active engagement** — active-session timer, idle detection, minimum-engagement floors (cannot submit before genuine engagement). This is the primary record of actual time.
- **Self-report + attestation** — the volunteer affirms they personally did the work and the time is genuine.
- **AI calibrated cap / outlier flag** — the AI estimate is the **ceiling** and the outlier detector: in-band self-reports auto-clear; outliers go to human review; nobody is credited above the cap. The estimate may only pull a number **down**, never up.
- **Quality gate** — rejected or low-effort work earns zero hours.

Credited time must correspond to genuine effort that produces the task's deliverable. An open timer with no engagement, or reading detached from a deliverable, does not count.

Three distinct numbers are involved, and only one is certified. The **AI estimate** is a planning figure and the cap. The **measured engagement** is the record of actual time. The **self-report** is the volunteer's attestation. On the CF 888 it is **colift's representative — not the volunteer — who certifies the hours** in Section 2; the certified number is the measured engagement bounded by the cap (`min(measured, cap)`), corroborated by the self-report. The estimate (calibrated with variance from reported data) sizes the cap; it is never itself the certified figure.

Defensible framing: *"We credit measured active engagement, bounded by an empirically-calibrated cap, gated on quality review — here are the methodology and the session records."* Not: *"Our AI predicts 3 hours, so we credit 3 hours."*

### 5.4 Estimate methodology

1. Seed caps with AI task decomposition (reading load = words ÷ reading speed; exercise complexity; output length).
2. **Calibrate to the observed median of real, quality-passing human sessions** — not the AI's a-priori guess.
3. **Document the methodology in writing**; recalibrate quarterly with version history.
4. Optionally, **structurally enforce time** (minimum engagement floors, time-gated content) so estimate ≈ actual *by design* — making a clean block-time credit a *true* statement, like crediting a shift.

### 5.5 Certification & governance

colift signs CF 888 as "a representative of the organization where the person volunteers" (allowed; colift genuinely assigns and reviews the work; the form requires no observation/supervision and carries no perjury jurat — see §3.2). De-risk the residual conflict: a **written verification methodology**, certification insulated from fundraising/growth metrics, human review confirming the work was performed, and an audit trail. Certify **actual volunteered hours only** (the §5.3 figure).

**Authorized representative and signing.** Section 2 requires a **named individual** who is a genuine authorized representative of the organization (officer, employee, or board-designated agent) — not the entity in the abstract, and not an outside party hired only to absorb liability (a figurehead signer is a sham that offloads nothing and simply spreads exposure). The board should formally designate the authorized representative(s) and document the delegation. That representative's signature **may be applied electronically and automatically** to forms generated from validated records — e-signatures are valid (federal **ESIGN Act**, 15 U.S.C. §7001; California **UETA**, Civ. Code §1633.1 et seq.), and the CF 888 has no notary or perjury jurat. Auto-signing changes the mechanics, not the accountability: the named person certifies every form, so the auto-signature must fire **only on submissions that passed the documented validation** (§5.3, §5.11), and the representative should sample and audit batches to genuinely stand behind the system. **[Confirm county/BenefitsCal acceptance of an e-signed CF 888.]**

**Officer-protection stack.** Because one named officer certifies at volume, use the standard nonprofit protections: sign **in official capacity** (on behalf of the entity, not personally); rely on the **501(c)(3) corporate liability shield** for ordinary civil claims; carry **D&O insurance** before certifying at scale; include **indemnification** for good-faith official acts in the bylaws (Cal. Corp. Code §5238); and anchor certifications in **good-faith reliance on the documented methodology** — criminal exposure (e.g., 18 U.S.C. §1001) requires *knowing or willful* falsity, so honest reliance on a sound system is not fraud even if a bad actor occasionally games it. What is not protected is knowingly certifying false forms or building a deliberately gameable system. Volume itself is not the risk; the reliability of the validation behind the signature is.

### 5.6 Volunteer-status hygiene

**Zero compensation** of any kind from colift to volunteers. No displacement of paid staff. Frame consistently: **"colift records and verifies hours; the County determines eligibility."** The only benefit is the independent State SNAP entitlement.

### 5.7 Identity basis

No ID.me required, but build a defensible chain that the **certified beneficiary personally did the certified hours**: one account per person, controls against one person farming multiple case numbers. colift's attestation must be supportable.

### 5.8 The two hard lines

1. **Never credit hours above actual measured time.**
2. **Never ship a task that is self-serving busywork rather than service to an external beneficiary.**

### 5.9 Onboarding & task-preparation time

Time a volunteer spends consuming content that is *reasonably necessary to perform the service* — onboarding packets, a style guide before translation QA, a data-collection protocol before a civic audit — **can count as volunteer time**, on the same footing a food bank counts a safety orientation or a crisis line counts pre-shift training. It holds only inside four guardrails; cross any one and it flips from volunteer work into education-as-beneficiary (the wrong ABAWD pathway — §5.10):

1. **Genuinely necessary to the task.** The content must be required to perform the service well, with a one-sentence necessity rationale on record — not general self-improvement.
2. **Proportionate — a clear minority of the engagement.** The bulk of credited time must be the volunteer *producing the service deliverable.* If consuming content becomes the main activity, the person is a student, not a volunteer.
3. **Tied to actual subsequent service.** Preparation must precede real volunteer output the person then performs.
4. **Not hour-padding.** Do not bolt "required reading" onto tasks to inflate monthly totals (the §4.2 estimate-inflation problem).

Mechanics: credit **measured engagement, not an estimate** (the §5.3 rule applies); credit core onboarding **once, not every month** (you don't re-onboard a recurring volunteer); and **document the necessity** of each required item — that note is the audit defense. The distinction: preparation *in service of* the work counts; content consumption *as* the activity does not.

### 5.10 Educational mission vs. training-for-hours (keep them separate)

The educational mandate (§5.1) is real and worth building toward, but two uses of "education" must never be blurred:

- **Educational *mission*, delivered as volunteer *service* — YES.** Volunteers who *produce* educational public goods (review AI-generated educational/plain-language content for free distribution, draft civic-literacy explainers, build community learning resources) are providing service in furtherance of an educational purpose. This is clean on CF 888 and is the incolift growth path.
- **Education/training the participant *receives*, counted for hours — DIFFERENT PATHWAY.** A person *receiving* training is a beneficiary, not a volunteer, and such hours generally count toward the ABAWD requirement only through a qualifying **work program** under 7 CFR §273.24(a)(1)(ii) — i.e., **CalFresh Employment & Training (E&T)** — a separate regulatory regime that **requires a provider contract with CDSS/the county** (and can draw federal reimbursement). This is a legitimate *future* expansion (a deliberate Phase-5 build), **not** a wording tweak to the volunteer model, and carries its own legal lift. **[Verify E&T mechanics with CDSS/the county before pursuing.]**

The boundary to hold: the volunteer-hours product stays about service the person *provides*; "training that itself counts as hours" is a separate program you build on purpose, with its own approvals, if and when you choose to.

### 5.11 Validation at scale, and participant use of AI

Manual human review of every submission does not scale and is not the plan. Validation is automated, with human attention reserved for exceptions:

- **Engagement measurement** (§5.3) is the primary integrity layer.
- **An automated agent** performs three narrow jobs: confirm a deliverable of the expected type is present and usable (not blank or junk), screen for personal information (§5.12), and flag hour or pattern outliers for a human spot-check. These are processing steps, not quality adjudication.
- **Attestation** — the volunteer affirms the work and time are genuine — backed by a **terms-of-service right to validate, retain records, and correct or reverse credited hours** if a submission is later found false.
- **Human review is exception-only**, triggered by flags — which is what makes it scale.

Participants may use AI tools in their work. The platform does not test for AI use, and does not use AI to detect AI — that is unreliable and beside the point. The integrity question is not *whether a tool was used* but *whether genuine effort produced a usable deliverable*, which engagement measurement and the usability check already address. Tasks should be designed so AI assistance is fine or irrelevant (e.g., a human reviewing and correcting an AI-generated translation — the value is the human judgment applied, whatever tools were used).

### 5.12 Privacy and personal information

Volunteer submissions (reflections, survey responses, community data, photos) can contain personal information, so instructing participants not to include it is necessary but not sufficient — some will include it anyway. The safeguards:

- **Data minimization** — collect only what the task requires.
- **Automated PII screening and redaction** before any output is distributed (the agent's most valuable job — §5.11).
- **A published privacy policy**, defined **retention limits**, and **access controls** on distributed outputs.
- **Heightened care for sensitive content** — SDOH/health-adjacent data and images of identifiable people warrant stricter handling.

California nonprofits sit largely outside the CCPA/CPRA's core obligations, but breach exposure and other privacy duties remain. This is an area for counsel and a written policy, not user instructions alone. **[Confirm current CCPA/CPRA nonprofit treatment with counsel.]**

---

## 6. Funding strategy and the certification firewall

colift is funded by **grants and donations** — a diversified base that may include foundations, government grants, individual donors, and **corporate philanthropy**, including from companies with a commercial interest in food access and community well-being. Corporate support for remote and virtual volunteering is ordinary, legitimate philanthropy. The fact that a funder benefits *indirectly* when the mission succeeds — greater food security, civic participation, community health, more dollars circulating in local economies — is **incidental private benefit**, which the law tolerates and which describes most charitable funding. It is not, by itself, a conflict: employers fund job-training nonprofits whose graduates they may hire; hospitals fund health nonprofits; that downstream interest does not taint the gift.

The variable to manage is narrow, and it exists only because **colift is also the certifier** of the CF 888 hours. Two structural practices keep it clean and let colift accept interested money with confidence:

1. **No funding conditioned on, or priced to, certification/enrollment outcomes.** General operating and program support is welcome from any aligned funder. What is avoided is a *quid pro quo* — payment tied to the number of recipients certified or kept enrolled. That is the actual line the law draws: funding the *mission* is fine; being *operated to produce a private party's revenue* is the version that draws private-benefit scrutiny (IRC §501(c)(3); Treas. Reg. §1.501(c)(3)-1(d)(1)(ii); *American Campaign Academy v. Commissioner*, 92 T.C. 1053 (1989)).
2. **The certification function is walled off from funders**, documented in the conflict-of-interest policy. No funder influences which tasks exist, how hours are measured, or who is certified. This firewall is what makes the verification *demonstrably* independent of anyone's financial interest — and is therefore the thing that lets even an obviously-interested funder participate without compromising the program.

Two lighter practices reinforce it: **reasonable diversification** (so the organization is plainly nobody's instrument) and, given the certifier role, **transparent disclosure of major funders** (which turns a "who's behind this?" question into a non-issue). Neither is a barrier to corporate support; both are cheap governance that makes the support easy to defend.

**Lobbying** is a separate matter: a 501(c)(3) cannot make lobbying a *substantial part* of its activities (IRC §501(c)(3); the §501(h) expenditure election sets dollar limits). That constrains colift's own lobbying, not a funder's independent advocacy. If organized policy advocacy ever becomes central to the work, house it in an affiliated **501(c)(4)**, kept at arm's length from the entity that signs the forms.

---

## 7. Agency relationships — what's required vs. what's wise

**Legally required: nothing.** There is no pre-approval gate. No statute, regulation, or CDSS guidance requires a 501(c)(3) to be vetted, registered, or partnered before signing CF 888. A fresh determination letter satisfies the qualifying-org category.

**No adverse precedent exists.** Multiple targeted searches (CDSS, county handbooks, FNS ABAWD Q&A, ACL 25-34, LSNC) found **no published guidance addressing remote/virtual/AI-validated volunteer hours — and nothing requiring in-person work.** The CF 888 and ACL 25-34 are silent on modality. **Conclusion: the model is unaddressed, not prohibited;** no legal interpretation is required to be compliant.

**But "can sign" ≠ "will be honored."** The CF 888 is an **optional tool**; the underlying requirement is that hours be **verified to the county's satisfaction**. California SNAP is **county-administered, state-supervised** (~58 county welfare departments). The caseworker makes the first call under CDSS policy and **7 CFR §273.2(f)**, with discretion to find verification inadequate and request more. A cluster of recipients all citing one unfamiliar online org is the pattern that draws a county data-match flag.

**Therefore: pre-clearance is prudence, not a prerequisite.** Optional but recommended:

1. **CDSS (policy):** a written read that the remote/online model qualifies — converting silence into an affirmative interpretation you solicited.
2. **1–2 pilot counties (operational):** informal buy-in where first volunteers live, so forms are accepted at the counter and colift is a known quantity.

---

## 8. What happens if a county rejects the hours

Rejection is **not the end**, and it's **not unreviewable**. SNAP benefits are a protected entitlement (*Goldberg v. Kelly*, 397 U.S. 254 (1970)), so:

1. **Notice of Action** with the reason and appeal rights (7 CFR §273.13).
2. **State fair hearing** before a **CDSS administrative law judge** — not the county (7 U.S.C. §2020(e)(10); 7 CFR §273.15; Cal. Welf. & Inst. Code §10950 et seq.). The ALJ reviews de novo; this is where wrongful rejections are overturned.
3. **Aid paid pending** if the hearing is requested before the action's effective date (7 CFR §273.15(k)).
4. **Judicial review** by writ of administrative mandamus (Cal. Code Civ. Proc. §1094.5) after exhausting the hearing.

**Why this matters for colift:** the fair hearing **tests the adequacy of colift's verification.** Strong records → the recipient wins, and favorable decisions build informal precedent for the model. Weak records → the recipient loses, and colift's design failure directly harms a low-income person. Two implications:

- The measured-hours-plus-methodology system is **both** audit defense **and** the evidence your users need to win an appeal.
- **Never guarantee outcomes.** Even a winning recipient endures weeks of stress and possible interim loss. Disclaim clearly: *colift records and verifies hours; the county determines eligibility.* Direct disputing recipients to a legal-aid SNAP specialist.

---

## 9. Strategy most likely to succeed (sequenced)

**Phase 0 — Build it right.** Stand up the 501(c)(3) (**full Form 1023**), conflict-of-interest policy, and the hours engine (§5.3) with documented estimate methodology (§5.4). Conform crediting to the verified CF 888 wording (§3.2). Curate an initial task catalog passing the four-part gate (§5.2), weighted to the strongest categories. Lock in diversified, arm's-length funding (§6).

**Phase 1 — (Optional) pre-clear.** Obtain CDSS's written interpretation and/or informal buy-in from 1–2 pilot county welfare departments. Bring your verification methodology — it's your credibility.

**Phase 2 — Pilot small.** Operate with a limited cohort in pilot counties. Track form-acceptance rates and caseworker pushback. Capture records you'd be comfortable putting in front of an ALJ. Support any rejected recipient through the fair-hearing process and use the outcome to refine.

**Phase 3 — Harden.** Use pilot data to recalibrate caps, tighten engagement measurement, and document a clean audit trail. Aim for at least one favorable fair-hearing decision to anchor the model.

**Phase 4 — Scale deliberately.** Expand county by county, leading each new county with your methodology and pilot track record — converting yourself from "anomaly" to "known, trusted verifier."

**Phase 5 — (Optional) deliberate expansion.** If and when the educational mandate extends into *training that itself counts toward the work requirement*, build it as a separate **CalFresh E&T provider** track with its own CDSS/county contracting (§5.10) — never by reframing the volunteer model. Keep the two hard lines (§5.8) and the funding discipline (§6) inviolable throughout every phase.

**Geographic scope.** The federal basis (7 CFR §273.24) applies nationwide, but the *verification layer is state-specific* and must be rebuilt per state. New York is a live example: it permits ABAWD volunteer/community service and has its own form (the **Monthly ABAWD Volunteer Participation Record**, completed by the host nonprofit), and **New York City** accepts documentation through the **ACCESS HRA** portal with active municipal benefits-access infrastructure — a plausible partner environment. But New York differs materially: it values volunteer hours by the **SNAP allotment ÷ minimum wage** formula (workfare-style), so required hours are typically far below 80 — unlike California's straight 80-hour standard. A New York build therefore needs a state-specific hours target and form, not a copy of the California flow. Pilot one state first; treat each additional state as its own state-law layer on the shared federal base. **[Confirm NY form signatory rules and the hours formula before building.]**

In sum: with no data sales, measured (not estimated) hours, and clean funding, the remaining question is one California has already answered — *can a SNAP recipient meet the ABAWD requirement through genuine volunteer work for a qualifying nonprofit that verifies the hours?* The model treats remote volunteering as the in-person equivalent, supported by a documented evidentiary trail.

---

## 10. Pre-launch checklist — status

### Resolved findings

1. **CF 888 Section 2 wording — RESOLVED.** Verified against the English form (rev. 5/25); see §3.2. Light certification, no perjury jurat, no observation requirement, no EIN field, no substitutes permitted. Crediting rule: certify actual volunteered hours only.

2. **Remote/online/AI-validated volunteer hours — RESOLVED (no precedent).** No published CDSS/county/FNS guidance addresses remote, virtual, or AI-validated volunteer hours, and nothing requires in-person work. The model is **unaddressed, not prohibited**; no legal interpretation is required to be compliant. Optional county pre-clearance is operational prudence (action below), not a legal prerequisite.

3. **Form 1023 vs. 1023-EZ — RESOLVED (use full Form 1023).** The funding strategy will exceed the EZ ceilings, making the EZ attestation false; there is no "EZ-then-upgrade" path. Cost is a one-time ~$325 IRS-fee delta (plus optional prep), not an annual cost. See §5.1.

### Remaining actions (cannot be closed by research)

4. **Pilot-county operational buy-in** — requires direct outreach to 1–2 county welfare departments. Recommended for smooth acceptance; de-risk with a pre-clearance packet (cover letter + one-page verification-methodology spec).

5. **Counsel review** — licensed nonprofit/public-benefits attorney to bless: (a) the certification methodology; (b) volunteer-status documentation (no compensation / no staff displacement / FLSA–ABC posture); (c) the Form 1023 path, including any already-filed 1023-EZ that should be addressed; (d) the funding structure and private-benefit risk if any interested corporate money is involved; (e) the privacy/PII program and CCPA/CPRA nonprofit treatment (§5.12).

---

## 11. Primary sources

**Federal**
- 7 CFR §273.24 (ABAWD; unpaid work at (a)(2)(iii)): https://www.law.cornell.edu/cfr/text/7/273.24
- 7 CFR §273.7 (general work provisions): https://www.law.cornell.edu/cfr/text/7/273.7
- 7 CFR §273.15 (fair hearings); §273.2(f) (verification); §273.13 (notices of adverse action)
- 29 CFR §553.101 (public-agency volunteers — *inapplicable to nonprofits*): https://www.law.cornell.edu/cfr/text/29/553.101
- 7 U.S.C. §2020(e)(10) (fair hearing); §2024 (SNAP fraud); 18 U.S.C. §1001 (false statements)
- IRC §§511–513 (UBIT); §501(c)(3) and Treas. Reg. §1.501(c)(3)-1(d)(1)(ii) (private benefit/inurement)
- IRS Form 1023-EZ Instructions / eligibility worksheet: https://www.irs.gov/instructions/i1023ez

**California**
- CDSS ACL 25-34 / CF 888 (via CalFresh Update 2025-07): https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/Updates/2025/CalFresh_Update_2025-07.htm
- CF 888 form (English): https://cdss.ca.gov/Portals/9/Additional-Resources/Forms-and-Brochures/2020/A-D/CF888.pdf
- "Satisfying the ABAWD Work Requirement" (county handbook): https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/ABAWDs/StsfygABAWDWkReq.htm
- LSNC Regulation Summaries, "New ABAWD forms": https://reg.summaries.guide/2025/06/new-abawd-forms/
- LSNC CalFresh Guide (ways to meet the requirement): https://calfresh.guide/work-programs-for-people-subject-to-abawd-requirements/
- Cal. Welf. & Inst. Code §10950 et seq. (state hearings); §10980 (CalFresh fraud); Cal. Labor Code §2775 (ABC test); Cal. Code Civ. Proc. §1094.5 (administrative mandamus)

**OBBBA / H.R. 1 (2025)**
- National Agricultural Law Center, OBBBA Nutrition Title: https://nationalaglawcenter.org/one-big-beautiful-bill-act-nutrition-title/

**Case law**
- *Tony & Susan Alamo Foundation v. Secretary of Labor*, 471 U.S. 290 (1985): https://caselaw.findlaw.com/court/us-supreme-court/471/290.html
- *Goldberg v. Kelly*, 397 U.S. 254 (1970); *Dynamex Operations West v. Superior Court*, 4 Cal.5th 903 (2018); *Better Business Bureau v. United States*, 326 U.S. 279 (1945); *United Cancer Council v. Commissioner*, 165 F.3d 1173 (7th Cir. 1999); *American Campaign Academy v. Commissioner*, 92 T.C. 1053 (1989) *(citations reliable; not all re-pulled this session)*

---

*This is a strategy document, not legal advice. Engage qualified nonprofit/public-benefits counsel before operating. Confirm current IRS and California fee amounts before filing.*
