#!/usr/bin/env tsx
/**
 * Patches locale files with English fallbacks for any key present in en.ts
 * but absent from the locale file. Run once to fix TS errors; translate later.
 *
 * Usage: tsx scripts/patch-locale-gaps.ts
 */

import { readFileSync, writeFileSync } from "fs";

// Keys and their English values that need to be inserted into the `landing`
// section of each locale file (before `secondaryCta`).
const LANDING_FLAT_KEYS: [string, string][] = [
  ["skipToContent", "Skip to content"],
  ["heroTitle1", "Useful work,"],
  ["heroTitle2", "in your neighborhood"],
  ["heroParagraph", "colift lists real civic tasks from local nonprofits and public agencies — count trees, translate a flyer, map a sidewalk, audit a website. Do it on your own time. Every task ships a free public dataset when it's done."],
  ["heroCta", "Find a task"],
  ["heroCtaSecondary", "How it works"],
  ["trustFree", "Free & nonprofit-run"],
  ["trustOpenData", "Open public datasets (CC0)"],
  ["trustSnap", "SNAP-certifiable"],
  ["heroBoardNoticeTitle", "Street tree count — volunteers needed Saturday morning."],
  ["heroBoardNoticeLabel", "Community notice"],
  ["heroBoardOrgLine", "Food Access Coalition · Field data, remote"],
  ["heroBoardTaskTitle", "Map free-meal sites near transit stops in your zip code"],
  ["heroBoardNearYou", "Near you"],
  ["heroBoardSnapCert", "SNAP/EBT certifiable"],
  ["heroBoardDuration", "~ 2 hours"],
  ["heroBoardVolunteer", "Volunteer"],
  ["heroBoardHoursCertified", "8.5 hours certified"],
  ["heroBoardThisMonth", "this month"],
  ["heroBoardApproved", "Approved"],
  ["heroBoardTreeCensus", "Tree census"],
  ["heroBoardTreeHours", "2.0 h"],
  ["heroBoardTranslation", "Translation"],
  ["heroBoardTranslationHours", "3.5 h"],
  ["heroBoardAudits", "Audits"],
  ["heroBoardAuditHours", "3.0 h"],
  ["heroBoardWorkHours", "Work hours · pre-filled"],
  ["taskSectionTitle", "Work neighbors are doing this week"],
  ["taskSectionParagraph", "Browse freely — sign up when you find one you want to volunteer for. Every task helps someone outside yourself."],
  ["taskSectionCta", "See all opportunities"],
  ["publicGoodTitle", "A public good"],
  ["publicGoodParagraph", "Every dataset volunteers help build is released free to the public — to libraries, government, and anyone who needs it. That's what makes it qualify as community service in the first place."],
  ["outcomeFieldDataLabel", "Field data"],
  ["outcomeFieldDataTitle", "Street tree census"],
  ["outcomeFieldDataBody", "Volunteers counted and photographed 4,200 trees across three neighborhoods. The result is now a public layer the city can plan from."],
  ["outcomeTranslationLabel", "Translation"],
  ["outcomeTranslationTitle", "Notices that actually reach people"],
  ["outcomeTranslationBody", "Bilingual neighbors translate public notices into Spanish, Cantonese, Tagalog. Used by libraries and clinics, free."],
  ["outcomeWritingLabel", "Neighborhood writing"],
  ["outcomeWritingTitle", "Block-by-block descriptions"],
  ["outcomeWritingBody", "Plain-language neighborhood profiles for resource directories — written by the people who live there."],
  ["outcomeAuditLabel", "Public-site audits"],
  ["outcomeAuditTitle", "Sites people rely on"],
  ["outcomeAuditBody", "Accessibility and broken-link audits on benefits portals, library catalogs, and 311 forms. The reports go to the agency."],
  ["verifyTitle", "Hours that count toward your work requirement"],
  ["verifyParagraph", "If you receive SNAP/EBT, your reviewed volunteer hours can be certified on the work-hours form your state accepts — pre-filled with your details. You download it and upload it to your benefits portal yourself."],
  ["verifyBullet0", "Your real measured hours — capped, never inflated."],
  ["verifyBullet1", "A nonprofit reviewer signs off on the work."],
  ["verifyBullet2", "You stay in control of your information the whole way."],
  ["verifyCtaPrimary", "See how it works"],
  ["verifyCtaSecondary", "Estimate your hours"],
  ["certTitle", "SNAP / EBT work-hours verification"],
  ["certSubtitle", "Pre-filled with your details"],
  ["certApproved", "Approved"],
  ["certFieldVolunteer", "Volunteer"],
  ["certFieldMonth", "Month"],
  ["certFieldCase", "Case #"],
  ["certFieldReviewedBy", "Reviewed by"],
  ["certFieldVolunteerValue", "M. R."],
  ["certFieldMonthValue", "This month"],
  ["certFieldCaseValue", "●●●●● 4421"],
  ["certFieldReviewedByValue", "Civic Data Coalition"],
  ["certHoursByCategory", "Hours by category"],
  ["certRow0Name", "Street tree census"],
  ["certRow0Hours", "2.0"],
  ["certRow1Name", "Public-notice translation"],
  ["certRow1Hours", "3.5"],
  ["certRow2Name", "Benefits portal accessibility audit"],
  ["certRow2Hours", "3.0"],
  ["certTotalLabel", "Total certified"],
  ["certTotalValue", "8.5 h"],
  ["certFooter", "You download this and upload it to your benefits portal yourself. colift never submits it for you."],
  ["partnerTitle", "How to post on colift"],
  ["partnerParagraph", "Sponsor civic tasks, review the work that comes back, and certify volunteer hours for the people you serve."],
  ["partnerCtaPrimary", "Become a partner"],
  ["partnerCtaSecondary", "How certification works"],
  ["partnerRow0Title", "Local nonprofits"],
  ["partnerRow0Sub", "Tasks your staff already need"],
  ["partnerRow1Title", "Public agencies"],
  ["partnerRow1Sub", "Civic data, audits, translation"],
  ["partnerRow2Title", "Free certification"],
  ["partnerRow2Sub", "Work-hours form generated for you"],
];

// Other missing keys by namespace path → English value
const OTHER_MISSING: { searchFor: string; insertBefore: string; newKey: string; value: string }[] = [
  // footer.tagline
  {
    searchFor: "    tagline:",
    insertBefore: "SKIP", // already in en.ts, need to add to locale files if missing
    newKey: "tagline",
    value: "Online volunteering that counts toward your SNAP work requirement.",
  },
  // deliverables.categoryCitizenScience
  {
    searchFor: '    categoryCitizenScience:',
    insertBefore: 'SKIP',
    newKey: 'categoryCitizenScience',
    value: 'Citizen science',
  },
];

const LOCALES = ["es", "ko", "tl", "vi", "zh"];

function escapeForString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

for (const locale of LOCALES) {
  const path = `./lib/i18n/dictionaries/${locale}.ts`;
  let src = readFileSync(path, "utf8");

  // 1. Add flat landing keys before `secondaryCta` in the landing section
  const insertionPoint = '    secondaryCta:';
  if (src.includes(insertionPoint)) {
    const missingKeys = LANDING_FLAT_KEYS.filter(([key]) => !src.includes(`    ${key}:`));
    if (missingKeys.length > 0) {
      const block = missingKeys.map(([k, v]) => `    ${k}: "${escapeForString(v)}",`).join("\n");
      src = src.replace(insertionPoint, `${block}\n${insertionPoint}`);
      console.log(`${locale}: inserted ${missingKeys.length} flat landing keys`);
    } else {
      console.log(`${locale}: flat landing keys already present`);
    }
  }

  // 2. Add footer.tagline if missing
  if (!src.includes("    tagline:")) {
    // Find the footer section and add tagline before the first existing footer key
    const footerMatch = src.match(/  footer: \{[\n\r]+    (\w)/);
    if (footerMatch) {
      const firstKey = footerMatch[1];
      // Find the exact line to insert before
      const footerSection = src.indexOf("  footer: {");
      const afterOpen = src.indexOf("\n", footerSection) + 1;
      src = src.slice(0, afterOpen) + `    tagline: "Online volunteering that counts toward your SNAP work requirement.",\n` + src.slice(afterOpen);
      console.log(`${locale}: added footer.tagline`);
    }
  }

  // 3. Add categoryCitizenScience if missing
  if (!src.includes("categoryCitizenScience:")) {
    src = src.replace(
      "    categoryCommunityService:",
      `    categoryCommunityService:`
    );
    // Insert after categoryCommunityService
    src = src.replace(
      /    categoryCommunityService: (".*?"),/,
      (m, val) => `    categoryCommunityService: ${val},\n    categoryCitizenScience: "Citizen science",`
    );
    console.log(`${locale}: added categoryCitizenScience`);
  }

  // 4. Add govAuditDone.certifiedMinutes, datasetNotePre, datasetNotePost if missing
  if (!src.includes("certifiedMinutes:")) {
    src = src.replace(
      /    datasetLink: (".*?"),/,
      (m, val) => `    certifiedMinutes: "minutes",\n    datasetNotePre: "This audit's data is released publicly at",\n    datasetNotePost: "under a CC0 license.",\n    datasetLink: ${val},`
    );
    console.log(`${locale}: added govAuditDone keys`);
  }

  // 5. Add orgDashboard missing keys
  if (!src.includes("noOrgLinked:") && src.includes("  orgDashboard:")) {
    src = src.replace(
      /  orgDashboard: \{[\r\n]+    title:/,
      `  orgDashboard: {\n    noOrgLinked: "No organization linked to your account.",\n    pendingAwaitingReview: "Awaiting review",\n    hoursMonthLabel: "hours this month",\n    aVolunteer: "A volunteer",\n    title:`
    );
    console.log(`${locale}: added orgDashboard keys`);
  }

  // 6. Add reviewQueue missing keys
  if (src.includes("  reviewQueue:") && !src.includes("volunteerFallback:")) {
    src = src.replace(
      /  reviewQueue: \{[\r\n]+    title:/,
      `  reviewQueue: {\n    noOrgLinked: "No organization linked.",\n    subhead: "Review submitted work and approve volunteer hours.",\n    volunteerFallback: "A volunteer",\n    submitted: "Submitted",\n    needsALook: "Needs a look",\n    title:`
    );
    console.log(`${locale}: added reviewQueue keys`);
  }

  // 7. Add orgTasks.noOrgLinked
  if (src.includes("  orgTasks:") && !src.includes("noOrgLinked:")) {
    src = src.replace(
      /  orgTasks: \{[\r\n]+    title:/,
      `  orgTasks: {\n    noOrgLinked: "No organization linked.",\n    title:`
    );
    console.log(`${locale}: added orgTasks.noOrgLinked`);
  }

  // 8. Add orgProfilePage missing keys
  const orgProfileMissing: [string, string][] = [
    ["noOrgLinked", "No organization linked."],
    ["contactEmailPlaceholder", "org@example.org"],
    ["streetAddressPlaceholder", "123 Main St"],
    ["suitePlaceholder", "Suite 100"],
    ["cityPlaceholder", "City"],
    ["statePlaceholder", "CA"],
    ["zipPlaceholder", "00000"],
  ];
  if (src.includes("  orgProfilePage:")) {
    for (const [key, val] of orgProfileMissing) {
      if (!src.includes(`    ${key}:`)) {
        src = src.replace(
          /  orgProfilePage: \{[\r\n]+    title:/,
          `  orgProfilePage: {\n    ${key}: "${val}",\n    title:`
        );
      }
    }
    // Check if any were missing
    const anyAdded = orgProfileMissing.some(([k]) => !src.includes(`    ${k}: "`));
    if (!anyAdded) console.log(`${locale}: orgProfilePage keys ok or added`);
  }

  // 9. Add orgTeam missing keys
  if (src.includes("  orgTeam:") && !src.includes("errorNoOrg:")) {
    src = src.replace(
      /  orgTeam: \{[\r\n]+    title:/,
      `  orgTeam: {\n    errorNoOrg: "No organization linked to your account.",\n    unnamedMember: "Team member",\n    title:`
    );
    console.log(`${locale}: added orgTeam keys`);
  }

  writeFileSync(path, src, "utf8");
}

console.log("Done patching locale files.");
