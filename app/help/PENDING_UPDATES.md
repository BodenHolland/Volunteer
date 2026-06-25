# Help Center — Pending Updates

> **Machine-readable manifest of unresolved items in the public help center.**
> A future Claude/Codex session prompted with "what needs to be updated in the Help Center?" should read this file, scan the `<Placeholder>` usages it references, and report back the current state.
>
> When everything in this file is resolved, delete the file (or move it to `_archive/`) and remove the noindex from `app/help/layout.tsx`.

## Status

- **Live, but `noindex,nofollow,nocache`** (see `app/help/layout.tsx`). Pages are reachable by direct URL, not yet indexed by search engines.
- **DRAFT banner removed** from public pages. A small "Last updated" footer appears instead.
- **Open placeholders are still visually marked** as amber pills via `<Placeholder>` so a human visitor sees them.

## Outstanding items

### 1. Replace text placeholders (visible to users as amber pills)

| File | Placeholder | What to put there |
|---|---|---|
| `app/help/12-caseworkers/page.tsx` | `[contact email]` | Live caseworker contact email |
| `app/help/12-caseworkers/page.tsx` | `[phone]` | Live caseworker contact phone |
| `app/help/12-caseworkers/page.tsx` | `[Audit & methodology ledger]` | Link text + href for the live ledger |
| `app/help/13-ledger/page.tsx` | `[ledger URL]` | Live URL of the audit/methodology ledger |
| `app/help/13-ledger/page.tsx` | `[contact email]` | Live records-request contact email |
| `app/help/15-legal-help/page.tsx` | `[contact email]` | Live legal-aid records contact email |

A future agent can find every remaining occurrence with:

```
grep -rn "<Placeholder>" app/help
```

### 2. Verify entity-status statements are still accurate

These pages make present-tense claims that depend on the org being a 501(c)(3) with a designated authorized representative. **Once colift's IRS determination is granted AND the board has formally designated an authorized representative, no edit is needed.** If those are not yet true at the time of review, the present-tense language in these pages must be softened to forward-looking ("is being established as" / "will be designated") or the pages should be unpublished.

Pages with present-tense entity claims:
- `app/help/1-what-is-colift/page.tsx` ("501(c)(3) public charity")
- `app/help/3-funding/page.tsx` (IRS §501(c)(3) status)
- `app/help/4-what-counts/page.tsx` ("colift is a 501(c)(3) and meets the criteria.")
- `app/help/10-certifier/page.tsx` (board-designated authorized representative)
- `app/help/12-caseworkers/page.tsx` ("IRS determination letter")

A future agent should ask the user: **"Does colift currently hold its IRS 501(c)(3) determination letter, and has the board formally designated an authorized representative?"** If either answer is no, flag the affected pages.

### 3. Confirm the audit ledger at the URL placeholder actually exists

Article 13 promises an open ledger. Before replacing `[ledger URL]`, confirm the ledger is real, public, and contains at least: verification methodology, current per-task caps, calibration changelog, anonymized aggregate stats, authorized-representative roster, conflict-of-interest policy. If the ledger does not yet exist, do not replace the placeholder — instead, soften the language to "will be published at launch."

### 4. Counsel review

Articles 4, 5, 6, 8, and 12 publish specific legal positions and citations. **None of these should be presented as final without licensed counsel review.** When counsel has reviewed and signed off, note the date here and remove this item.

- [ ] Article 4 (What counts as SNAP volunteer hours, and our authority for it) — counsel review date: ____
- [ ] Article 5 (Why remote and online volunteer hours count) — counsel review date: ____
- [ ] Article 6 (Surveys & community-research contributions) — counsel review date: ____
- [ ] Article 8 (How we verify volunteer hours) — counsel review date: ____
- [ ] Article 12 (For caseworkers — a one-page methodology) — counsel review date: ____

### 5. Remove noindex when everything above is done

Edit `app/help/layout.tsx` and remove the `robots: { index: false, ... }` from the metadata.

### 6. (Optional) Add help center to main nav

Once indexed, add a link to `/help` from `SiteFooter` or `SiteHeader`.

---

## How a future session should use this file

If the user asks a future session something like:

> "What needs to be updated in the Help Center?"
> "Are there any pending items for the help center?"
> "Check the help center for unresolved placeholders."

The session should:

1. Read this file.
2. Run `grep -rn "<Placeholder>" app/help` to verify which placeholders remain.
3. Read each file listed in section 2 to confirm present-tense entity statements are still appropriate.
4. Report findings to the user as a checklist, grouped by the section numbers above.
5. Offer to make the edits if the user provides the missing values.
