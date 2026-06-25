---
name: colift-design
description: Visual design rules for the colift app. Use whenever editing UI in this repo — designing a new page, restyling an existing one, building components, picking colors/typography/spacing, or reviewing a design. Especially trigger when adding headings, cards, buttons, or marketing pages. Also trigger on words like "design", "visual", "style", "redesign", "polish", "header", "hero", "landing", "section".
---

# colift visual rules

Read this BEFORE writing any UI for the colift codebase. These are hard rules
from the project owner. Breaking them is the most common source of rework.

---

## 1. NEVER use eyebrows / overlines / kickers — top rule

An "eyebrow" is the small all-caps, letter-spaced label that sits *above* a
heading to categorize it (e.g. `A CIVIC-WORK PLATFORM` above a `<h1>`).

The owner hates them. Do not write them anywhere on the site, in any form.

**Banned patterns:**

```tsx
{/* ❌ NEVER */}
<p className="overline">A civic-work platform</p>
<h1>Useful work</h1>

{/* ❌ NEVER — same pattern, hand-styled */}
<p className="text-xs uppercase tracking-wide text-meta">Section name</p>
<h2>Heading</h2>

{/* ❌ NEVER — applies even with custom letter-spacing values */}
<p className="text-[11px] font-semibold uppercase tracking-[0.14em]">Label</p>
<h2>Heading</h2>
```

**Do this instead:** let the heading carry the meaning on its own. If the
heading needs more context, add a normal-case lead paragraph *below* it, not
a tiny uppercase label above it.

```tsx
{/* ✅ */}
<h2 className="text-[32px] font-semibold leading-tight text-ink md:text-[42px]">
  Work neighbors are doing this week
</h2>
<p className="mt-3 max-w-xl text-body">Browse freely — sign up when …</p>
```

The `.overline` CSS class in `app/globals.css` is reserved for tiny
component-internal labels (dropdown menu labels, status chips) — do not
introduce new above-heading usages of it.

---

## 2. NEVER use accent rails (colored left-edge strips on cards)

An "accent rail" is a thick colored border on one edge of a card or panel
(usually the left), used to categorize or visually accent the container.

**Banned patterns:**

```tsx
{/* ❌ NEVER */}
<div className="border border-civic-line border-l-[3px] border-l-civic-blue ...">

{/* ❌ NEVER — same idea with any color or thickness */}
<div className="border-l-4 border-teal ...">
<div className="border-l-2 border-field-green ...">
<aside className="border-l-4 border-community-red bg-community-red-soft ...">
```

Applies to task cards, callout boxes, alert panels, auth-shell wrappers,
profile/settings header bars — anywhere the visual is "card with a colored
side stripe".

**Do this instead:** use a full all-around border (`border border-civic-line`)
with a rounded radius, or a tinted background (`mode-task`, `mode-verify`,
etc.) at the section level. If a card needs categorization, put a small
label or icon *inside* the card body — not on its edge.

```tsx
{/* ✅ */}
<div className="card-task">…</div>          {/* white surface + Civic Line border */}
<div className="rounded-md border border-civic-line bg-white p-5">…</div>
<aside className="mode-notice rounded-md p-4">…</aside>  {/* tinted, no rail */}
```

Exception: standard markdown-prose blockquotes inside long-form articles may
keep a thin gray `border-left` — that's a typographic convention, not a card
accent. Everywhere else: no rails.

---

## 3. NEVER end a heading with a period

Headings — `h1` through `h6`, hero titles, section titles, card titles,
modal titles, page metadata titles — must not end with a period. They are
labels, not sentences.

```tsx
{/* ❌ NEVER */}
<h1>Useful work in your neighborhood.</h1>
<h2>Hours that count toward your work requirement.</h2>
<h3>A public good, not a profile.</h3>

{/* ✅ */}
<h1>Useful work in your neighborhood</h1>
<h2>Hours that count toward your work requirement</h2>
<h3>A public good, not a profile</h3>
```

Applies equally to heading strings stored in `lib/i18n/dictionaries/*.ts`
under keys like `title`, `heading`, `Heading`, `subhead`. Lead paragraphs
*below* a heading are sentences and keep their periods. Question marks and
exclamation points are also fine when the heading is genuinely a question
or interjection ("Ready to host civic work?").

---

## 4. Section CTAs go BELOW the content, not floating beside the heading

When a section has both a heading and a "See all X" / "Browse all" /
"View more" CTA, place the CTA on its own row underneath the cards/list,
not in a right-aligned column next to the heading.

```tsx
{/* ❌ NEVER — splits attention; the CTA competes with the title */}
<div className="grid items-end md:grid-cols-12">
  <div className="md:col-span-7"><h2>Work neighbors are doing this week</h2></div>
  <div className="md:col-span-5 md:text-right">
    <Button asChild variant="secondary"><Link href="/opportunities">See all</Link></Button>
  </div>
</div>
<div>{cards}</div>

{/* ✅ */}
<div className="max-w-2xl">
  <h2>Work neighbors are doing this week</h2>
  <p>Browse freely…</p>
</div>
<div className="mt-10">{cards}</div>
<div className="mt-10">
  <Button asChild variant="secondary"><Link href="/opportunities">See all</Link></Button>
</div>
```

The CTA is the natural next step *after* you've seen the previews — so it
follows them, not floats next to the title.

---

## 5. NEVER style a second line of a heading in italic serif

If a heading wraps to multiple lines (or uses a `<br>` inside it), every line
must use the same sans-serif weight and style. No italic serif accent on the
second clause, no "editorial" font switch mid-heading.

```tsx
{/* ❌ NEVER */}
<h1>
  Useful work,<br />
  <span className="font-editorial italic text-civic-blue">in your neighborhood.</span>
</h1>

{/* ✅ */}
<h1>
  Useful work,<br />
  <span className="text-civic-blue">in your neighborhood.</span>
</h1>
```

The `.font-editorial` class and the Newsreader serif font have been removed
from the codebase. Do not reintroduce them.

---

## 6. No California-specific language on marketing surfaces

colift is a **national** SNAP/EBT platform. The only place California-specific
copy belongs is:

1. Functional code that generates the actual California CF 888 form
   (`lib/cf888.ts`, `lib/forms/*.ts`), and
2. Help / legal-reference articles that cite specific state authorities
   (e.g. `app/help/4-what-counts` cites California ACL 25-34 and New York's
   ABAWD record). These articles are **about** state law and need the
   specific citation to be useful.

Everywhere else — homepage, About, How it works, For Organizations, Contact,
Deliverables, Help index, app dashboards, settings, onboarding — copy must
be national/generic. No "California", "CalFresh", "CDSS", "CF 888",
"BenefitsCal", "San Francisco", "Mission District", "the County", or
similar local references in user-visible strings.

**Banned in marketing copy:**

```
❌ "Starting June 1, 2026, California enforces an expanded work requirement…"
❌ "Hours that count toward your CalFresh work requirement"
❌ "State of California · CDSS · CF 888"
❌ "Upload it to BenefitsCal"
❌ "the County decides eligibility"
❌ Mission District / San Francisco / Bay Area in any task mockup
```

**Preferred neutral phrasings:**

```
✅ "Federal changes have expanded the work rules that apply to many adults
   who receive SNAP (EBT), and states are beginning to enforce them."
✅ "Your reviewed hours can be certified on the work-hours form your state
   accepts."
✅ "Upload it to your benefits portal yourself."
✅ "Your state's benefits agency decides eligibility."
✅ Generic neighborhood references ("near transit stops in your zip code"),
   not city-specific ones.
```

Naming SNAP's state aliases as a *list* is fine (e.g. "Your state may call
SNAP CalFresh, Lone Star, ACCESS, etc."). What's banned is **leading with**
or **defaulting to** the California variant.

---

## 7. White is the default canvas — moods are intentional, never global

The default page and section background is **white**. Don't tint a whole
page in Paper, Sage, Sand, or Lilac and call it a day. Doing so is the
single most common way colift pages start looking dated or lazy.

**Rules:**

- `<body>` is white. Hero sections are white.
- Use **one** tinted mood per page, **at most two**, and only when the
  content actually maps to that mood. Alternate with white sections so
  the page has rhythm.
- Within a single page, every section must make an obvious choice:
  white (default) **or** a specific mood that matches its content. No
  page should be "all tan" or "all sage."

**Mood → content mapping:**

| Mood class           | Background          | Use for                                                       |
|----------------------|---------------------|---------------------------------------------------------------|
| (none — `bg-white`)  | White               | Default. Hero, operational/methodical sections, clean closes. |
| `mode-task`          | Task Sky            | Opportunity discovery, task lists, active contribution.       |
| `mode-verify`        | Verification Sage   | Approved hours, certification, trust, privacy, principles.    |
| `mode-community`     | Community Lilac     | Stories, motivation, the "why," human-centered impact.        |
| `mode-partner`       | Warm Sand           | Partner / nonprofit / institutional / eligibility.            |
| `mode-notice`        | Notice Yellow tint  | Short educational tips and callouts (small areas only).       |
| `bg-ink text-paper`  | colift Ink          | Strong institutional close, partner CTA, footer.              |

**Banned patterns:**

```tsx
{/* ❌ Whole page in Paper / one mood */}
<main><section className="bg-paper">…</section>
      <section className="bg-paper">…</section>
      <section className="bg-paper">…</section></main>

{/* ❌ Using `bg-section` because it "feels neutral" — that legacy alias
       now points to white, but writing it implies a tint that isn't there */}
<section className="bg-section">…</section>
```

**Good pattern:**

```tsx
<main>
  <section className="bg-white">…hero…</section>
  <section className="mode-community">…the why…</section>
  <section className="bg-white">…the how…</section>
  <section className="mode-verify">…principles / trust…</section>
  <section className="bg-ink text-paper">…CTA close…</section>
</main>
```

Paper (`bg-paper` / `#FAF7F0`) still exists as a token but is reserved for
small accents (chips, code blocks, nav highlights), not page or section
backgrounds. The legacy `bg-section` alias now resolves to white.

---

## 8. Color palette (colift v2)

All colors live as `@theme` tokens in `app/globals.css`. Use the raw token
names (`bg-civic-blue`, `text-field-green`, etc.) for new code.

| Role | Token | Hex |
|---|---|---|
| Text, wordmark, headings | `ink` | `#13231e` |
| Secondary text, metadata | `slate` | `#5e6b65` |
| Primary actions, links, task UI | `civic-blue` | `#2854c5` |
| Verification, approved, trust | `field-green` | `#1d6b57` |
| Urgency, errors (sparingly) | `community-red` | `#c84f35` |
| Emphasis accent (sparingly) | `notice-yellow` | `#f4c84a` |
| Default page background | `paper` | `#faf7f0` |
| Working surfaces | `white` | `#ffffff` |
| Borders, dividers | `civic-line` | `#d6ddd6` |

**Section moods** (use at the section level, not inside cards): `mode-task`
(Task Sky), `mode-verify` (Verification Sage), `mode-community` (Lilac),
`mode-partner` (Warm Sand), `mode-notice` (Notice tint).

**Color rules:**
- Keep ~70% of the experience in Paper, White, Ink, Slate.
- No gradients. Borders > shadows.
- Use blue and green as the two primary functional colors; red and yellow
  only as accents.
- Dark Ink text on pale tinted backgrounds. Never small blue/green/yellow/red
  text on a tint without verifying contrast.

Legacy aliases (`bg-navy`, `text-forest`, `bg-section`, etc.) still resolve
correctly — leave existing code alone but use the new names in new code.

---

## 9. Typography

- Sans-serif only — Inter. No serif accent fonts.
- Sentence case for headings. No ALL-CAPS headlines.
- Body text ≥ 16px. Generous line height (1.6).
- Headings: tight tracking (`tracking-tight`), `font-semibold` (not bold).

Suggested scale:
- Display / hero: 40-68px
- H2: 32-44px
- H3: 22-28px
- Body: 16-17px
- Labels / small: 12-13px (sentence case, not uppercase)

---

## 10. Cards

- **Task card** (`.card-task`): white, Civic Line border, 3px Civic Blue
  left rail, soft elevation on hover. Used for tasks/opportunities.
- **Verification card** (`.card-verify`): Verification Sage background, Field
  Green-leaning border. Used for approved hours, documents, trust.
- **Flat card** (`.card-flat`): white surface with Civic Line border. The
  utility default.

Don't introduce a fourth card variant without a clear reason.

---

## 11. Buttons

Primary `bg-civic-blue text-white`, secondary `border border-civic-line bg-white text-ink`,
accent (verification) `bg-field-green text-white`. One filled CTA per region;
secondary actions are bordered, not filled. No pill buttons.

---

## 12. Spacing, radius, motion

- Page padding: 32px desktop, 20px mobile. Max width 1280px.
- Section vertical spacing: ~96-112px desktop, ~56-72px mobile.
- Radii: `8 / 10 / 14 / 22` (sm/md/lg/xl). Modest, not pillowy.
- Borders carry the most visual weight. Use `--shadow-elev` sparingly.
- Motion: 160-200ms ease. No flashy animations.

---

## 13. Header

- White background, 1px Civic Line bottom border, ~72px tall.
- Soft shadow appears **only after scroll**.
- One filled Civic Blue CTA. Login is a plain text link.
- No glass blur, no gradient, no permanent shadow.

---

## 14. Brand voice

Practical · warm · credible · civic · calm · slightly editorial · accessible
under stress. NOT: generic startup landing, government website, corporate
volunteer portal, finance dashboard, noisy AI collage, Idealist clone.

---

## Pre-commit checklist for any UI change

- [ ] No eyebrows / overlines / above-heading uppercase labels anywhere new.
- [ ] No heading or `title:` dictionary string ends with a period.
- [ ] Section "See all" / "Browse more" CTAs sit on their own row BELOW
      the cards/list, not right-aligned next to the heading.
- [ ] No accent rails (`border-l-[N]px border-l-{color}`) on cards or
      callout containers. Use a full border or a tinted background instead.
- [ ] No California-specific language in user-visible copy outside of help
      articles that cite state law and the CF-888-generating functional code.
      No "CalFresh", "CDSS", "BenefitsCal", "San Francisco", "the County",
      etc. in marketing/dashboard/onboarding strings.
- [ ] White is the default canvas; each section is either `bg-white` or one
      specific mood (`mode-task` / `mode-verify` / `mode-community` /
      `mode-partner` / `bg-ink`). No page is "all tan" or "all sage."
      No use of `bg-paper` or `bg-section` for full-section backgrounds.
- [ ] No `font-editorial`, no italic serif anywhere — and no second-line
      font switch inside a single heading.
- [ ] Landing page copy is SNAP/EBT generic — no CalFresh, no CDSS, no
      "State of California", no CF 888 in marketing surfaces.
- [ ] Primary CTA is filled Civic Blue; only one per region.
- [ ] Section moods used at the section level, not on individual cards.
- [ ] All new color usage uses colift v2 token names where practical.
- [ ] Tested at 1440 desktop and 390 mobile widths.
