/**
 * Idempotent seed: wipes every table and reinserts the demo dataset.
 * Used by /admin/reset and the first-run bootstrap.
 *
 * Demo-data notes:
 * - Two orgs: SF Civic Data Coalition (fictional) and Friends of the Urban
 *   Forest (real address, illustrative — has not signed on).
 * - The live demo commits to the tree census (FUF's task), so the reviewer who
 *   closes the loop is FUF's reviewer (Daniel Okafor). FUF's queue is seeded
 *   with 2 other pending submissions so it reads "3 awaiting" once the demo
 *   recipient submits. (The spec narration says "SFCDC reviewer"; an org can
 *   only review its own tasks, so the demo uses the task's org — see README.)
 */
import type { ChecklistItem, DeliverableSpec } from "./types";

export interface Persona {
  user_id: string;
  label: string;
  sublabel: string;
  role: "recipient" | "org_member" | "admin";
}

// ---- stable ids ----
export const ORG_SFCDC = "org_sfcdc";
export const ORG_FUF = "org_fuf";

export const USER_MARISOL = "user_marisol";
export const USER_TREVOR = "user_trevor";
export const USER_PRIYA = "user_priya";
export const USER_DANIEL = "user_daniel";
export const USER_ADMIN = "user_admin";
export const USER_ANDRE = "user_andre";
export const USER_LINH = "user_linh";

export const TASK_TREES = "task_trees";
export const TASK_TRANSLATE = "task_translate";
export const TASK_HAZARDS = "task_hazards";
export const TASK_SPACE = "task_space";
export const TASK_INPUT = "task_input";
export const TASK_SEMINAR = "task_seminar";

export const PERSONAS: Persona[] = [
  { user_id: USER_MARISOL, label: "Marisol Reyes", sublabel: "Recipient · certifies CalFresh hours", role: "recipient" },
  { user_id: USER_TREVOR, label: "Trevor Nakamura", sublabel: "Recipient · volunteer only", role: "recipient" },
  { user_id: USER_DANIEL, label: "Daniel Okafor", sublabel: "Friends of the Urban Forest · reviewer", role: "org_member" },
  { user_id: USER_PRIYA, label: "Priya Venkatesan", sublabel: "SF Civic Data Coalition · admin", role: "org_member" },
  { user_id: USER_ADMIN, label: "Alex Mercado", sublabel: "Tended · admin", role: "admin" },
];

const DAY = 86_400_000;
const HOUR = 3_600_000;

function ym(now: number): string {
  const d = new Date(now);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// ---- task content ----
interface SeedTask {
  id: string;
  org_id: string;
  title: string;
  category: DeliverableSpec["kind"];
  short_description: string;
  instructions_md: string;
  checklist: ChecklistItem[];
  spec: DeliverableSpec;
  rubric: string;
  est: number;
  max: number;
  location: "online" | "in_person" | "hybrid";
}

const TASKS: SeedTask[] = [
  {
    id: TASK_TREES,
    org_id: ORG_FUF,
    title: "Census your block's street trees",
    category: "data-collection",
    short_description:
      "Walk your block and log every street tree — species, size, and condition — so the urban forest map stays current.",
    instructions_md:
      "## What you'll do\nStreet trees cool the sidewalk, clean the air, and need regular eyes on them. Walk one block and record what's there.\n\n1. Pick a block you can reach on foot.\n2. Walk **both sides**, end to end.\n3. For each tree, note the **species** (a best guess is fine), the **trunk size** (skinny / medium / thick), and any **visible problems** (broken limbs, lifting sidewalk, dead branches).\n4. Photograph at least **3** trees clearly.\n5. Mark any **empty basins or stumps** where a tree could go.\n\n## What the org gets\nFriends of the Urban Forest folds your block into the citywide tree inventory used to schedule pruning and new plantings.",
    checklist: [
      { id: "walk", label: "Walk both sides of the block, end to end", required: true },
      { id: "species", label: "Note a species (or best guess) for each tree", required: true },
      { id: "condition", label: "Record trunk size and visible condition", required: true },
      { id: "photos", label: "Photograph at least 3 trees", required: true },
      { id: "gaps", label: "Mark empty basins or stumps", required: false },
    ],
    spec: { kind: "data-collection", min_photos: 3, require_geotag: true },
    rubric:
      "A complete submission includes at least 3 clear, original photos of distinct street trees taken in San Francisco, plus notes covering species guesses and condition for the block. Photos should look like real on-the-ground phone photos (sidewalk, foliage, daylight). Flag if photos are stock-like, duplicated, or clearly not of street trees. Reject if there are fewer than 3 photos or no condition notes.",
    est: 3,
    max: 5,
    location: "in_person",
  },
  {
    id: TASK_TRANSLATE,
    org_id: ORG_SFCDC,
    title: "Translate this city flyer into Spanish",
    category: "translation",
    short_description:
      "Help a city notice reach more neighbors. Translate a one-page flyer from English into clear, natural Spanish.",
    instructions_md:
      "## What you'll do\nWe'll give you the English text of a public-health flyer. Translate the whole thing into Spanish that a general audience can read easily.\n\n1. Read the source text all the way through first.\n2. Translate **every** section — don't skip headings or the fine print.\n3. Keep the structure (headings, bullets, phone numbers).\n4. Proofread for tone and accuracy.\n\n## What the org gets\nSF Civic Data Coalition distributes translated notices to community organizations across the city.",
    checklist: [
      { id: "read", label: "Read the full English source first", required: true },
      { id: "translate", label: "Translate every section, including fine print", required: true },
      { id: "format", label: "Keep headings, bullets, and numbers intact", required: true },
      { id: "proof", label: "Proofread for tone and accuracy", required: true },
    ],
    spec: { kind: "translation", source_lang: "English", target_lang: "Spanish", min_words: 120 },
    rubric:
      "A complete submission is a faithful, natural Spanish translation of the provided English flyer that covers all sections and preserves structure. Flag if large sections are missing, machine-translation artifacts are obvious, or the text reads as AI-generated filler unrelated to the source. Reject if the translation is empty or clearly not Spanish.",
    est: 2,
    max: 4,
    location: "online",
  },
  {
    id: TASK_HAZARDS,
    org_id: ORG_SFCDC,
    title: "Map 10 sidewalk hazards",
    category: "data-collection",
    short_description:
      "Document ten trip hazards, blocked curb ramps, or broken sidewalks in your neighborhood so they can be reported to Public Works.",
    instructions_md:
      "## What you'll do\nMany sidewalk hazards never get reported. Find ten and document them.\n\n1. Walk your neighborhood and spot **10** distinct hazards (lifted slabs, blocked curb ramps, deep cracks, missing grates).\n2. Photograph **each one** clearly.\n3. Note the nearest cross-streets and a one-line severity note.\n\n## What the org gets\nSF Civic Data Coalition bundles your reports into a 311 batch and tracks which get fixed.",
    checklist: [
      { id: "find", label: "Identify 10 distinct hazards", required: true },
      { id: "photo", label: "Photograph each hazard", required: true },
      { id: "locate", label: "Note nearest cross-streets for each", required: true },
      { id: "severity", label: "Add a one-line severity note for each", required: true },
    ],
    spec: { kind: "data-collection", min_photos: 10, require_geotag: true },
    rubric:
      "A complete submission has 10 clear, distinct, original photos of real sidewalk hazards in San Francisco, each with a location and severity note. Flag duplicates, stock imagery, or geotags far outside SF. Reject if fewer than 10 distinct hazards are documented.",
    est: 4,
    max: 6,
    location: "in_person",
  },
  {
    id: TASK_SPACE,
    org_id: ORG_SFCDC,
    title: "Document a community space",
    category: "neighborhood-writing",
    short_description:
      "Visit a park, plaza, or community garden and write a short, vivid profile of who uses it and what it needs.",
    instructions_md:
      "## What you'll do\nWrite a short profile of a shared space in your neighborhood.\n\n1. Spend time at a park, plaza, library, or community garden.\n2. Write **at least 250 words**: what the space is, who uses it, what's working, and what it needs.\n3. Include **one** photo.\n\n## What the org gets\nSF Civic Data Coalition uses these profiles in neighborhood needs assessments.",
    checklist: [
      { id: "visit", label: "Spend time at the space in person", required: true },
      { id: "write", label: "Write at least 250 words", required: true },
      { id: "users", label: "Describe who uses the space", required: true },
      { id: "photo", label: "Attach one photo", required: true },
    ],
    spec: { kind: "neighborhood-writing", min_words: 250, min_photos: 1 },
    rubric:
      "A complete submission is a 250+ word, specific, first-hand profile of a real San Francisco community space, with one photo. Flag generic writing that could describe anywhere, or text that reads as AI-generated. Reject if under the word count or missing the photo.",
    est: 2,
    max: 4,
    location: "in_person",
  },
  {
    id: TASK_INPUT,
    org_id: ORG_SFCDC,
    title: "Civic input: how should District 7 spend $100k?",
    category: "civic-input",
    short_description:
      "Weigh in on a participatory-budgeting question. Rank priorities and explain your top choice in a few sentences.",
    instructions_md:
      "## What you'll do\nDistrict 7 has $100,000 in participatory-budget funds. Tell us where it should go.\n\n1. Review the five options.\n2. Rank them.\n3. Explain your **top choice** in 3–5 sentences.\n\n## What the org gets\nSF Civic Data Coalition aggregates responses into a district summary shared with the supervisor's office.",
    checklist: [
      { id: "review", label: "Review all five options", required: true },
      { id: "rank", label: "Rank the priorities", required: true },
      { id: "explain", label: "Explain your top choice (3–5 sentences)", required: true },
    ],
    spec: {
      kind: "civic-input",
      survey: [
        {
          id: "rank",
          question: "Rank these from most to least important.",
          kind: "rank",
          options: [
            "Tree planting and green space",
            "Sidewalk and crosswalk repair",
            "After-school programs",
            "Senior meal delivery",
            "Small-business grants",
          ],
        },
        { id: "why", question: "Why is your top choice the right one? (3–5 sentences)", kind: "text" },
      ],
    },
    rubric:
      "A complete submission ranks the options and gives a thoughtful 3–5 sentence rationale that engages with the specific choices. Flag empty or one-word rationales. This is opinion input — do not reject for disagreeing; reject only if blank.",
    est: 1,
    max: 2,
    location: "online",
  },
  {
    id: TASK_SEMINAR,
    org_id: ORG_SFCDC,
    title: "Make a money-help guide for neighbors",
    category: "seminar",
    short_description:
      "Take a short financial-literacy seminar, then turn it into a one-page, plain-language money-help guide that's donated to a partner library for other residents to use.",
    instructions_md:
      "## What you'll do\nLearn the material, then make something useful for other people with it. The guide — not the watching — is the point.\n\n1. Complete the **pre-work** reflection.\n2. Watch the full recorded seminar.\n3. Write a **one-page, plain-language money-help guide** for neighbors — the public deliverable.\n4. Note where it will be shared (a partner library or community center).\n\n## What the org gets\nSF Civic Data Coalition donates the finished guides to a partner library so **other residents** can use them. The seminar is the input; the free public guide is the output.",
    checklist: [
      { id: "prework", label: "Complete the pre-work reflection", required: true },
      { id: "watch", label: "Watch the full seminar video", required: true },
      { id: "workbook", label: "Write the one-page plain-language guide for neighbors", required: true },
      { id: "reflect", label: "Note where the guide will be shared", required: true },
    ],
    spec: { kind: "seminar", require_prework: true, require_postwork: true, require_video: true },
    rubric:
      "A complete submission includes a finished one-page, plain-language money-help guide a resident could actually hand to a neighbor, plus the pre-work reflection and a note on where it will be shared. Flag generic, copied, or AI-filler content. Reject if the public guide is missing — the free deliverable for other residents is the point of the task.",
    est: 10,
    max: 12,
    location: "hybrid",
  },
];

function addr(o: { line1: string; line2?: string; city: string; state: string; zip: string }) {
  return JSON.stringify(o);
}

type Stmt = D1PreparedStatement;

export async function seedDatabase(db: D1Database, now: number = Date.now()): Promise<void> {
  const month = ym(now);

  // ---- wipe (children first) ----
  const wipeTables = [
    "submission_flags",
    "submission_files",
    "cf888_forms",
    "hours_ledger",
    "feedback",
    "submissions",
    "task_templates",
    "users",
    "orgs",
  ];
  for (const t of wipeTables) {
    await db.prepare(`DELETE FROM ${t}`).run();
  }

  const stmts: Stmt[] = [];

  // ---- orgs ----
  const orgIns = db.prepare(
    `INSERT INTO orgs (id, slug, name, ein, contact_email, logo_url, about_md, address_json,
      signing_authority_name, signing_authority_title, status, is_fictional, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
  );
  stmts.push(
    orgIns.bind(
      ORG_SFCDC,
      "sf-civic-data-coalition",
      "SF Civic Data Coalition",
      "84-1234567",
      "partners@sfcivicdata.org",
      null,
      "We turn neighborhood observations into open data that city agencies and community groups can act on. Volunteers map hazards, translate notices, and document public spaces across San Francisco.",
      addr({ line1: "2940 16th Street", line2: "Suite 200", city: "San Francisco", state: "CA", zip: "94103" }),
      "Priya Venkatesan",
      "Program Director",
      "active",
      1,
      now - 120 * DAY
    )
  );
  stmts.push(
    orgIns.bind(
      ORG_FUF,
      "friends-of-the-urban-forest",
      "Friends of the Urban Forest",
      "94-2698044",
      "info@fuf.net",
      null,
      "Friends of the Urban Forest helps San Franciscans plant and care for street trees and sidewalk gardens. (Shown here for illustration — FUF has not joined the Tended pilot.)",
      addr({ line1: "1007 General Kennedy Ave", line2: "#1", city: "San Francisco", state: "CA", zip: "94129" }),
      "Daniel Okafor",
      "Volunteer Coordinator",
      "active",
      0,
      now - 120 * DAY
    )
  );

  // ---- users ----
  const userIns = db.prepare(
    `INSERT INTO users (id, email, role, org_role, full_name, city, state, intent,
      legal_name, case_number, address_json, dob, phone, phone_verified_at,
      benefitscal_screenshot_r2_key, benefitscal_verified_at, org_id, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  );
  stmts.push(
    userIns.bind(
      USER_MARISOL,
      "marisol.reyes@example.com",
      "recipient",
      null,
      "Marisol Reyes",
      "San Francisco",
      "CA",
      "snap_cert",
      "Marisol Reyes Castellanos",
      "0712345",
      addr({ line1: "1242 Alabama Street", line2: "Apt 3", city: "San Francisco", state: "CA", zip: "94110" }),
      "1991-03-14",
      "(415) 555-0142",
      now - 30 * DAY,
      `verification/${USER_MARISOL}/benefitscal.png`,
      now - 30 * DAY,
      null,
      now - 35 * DAY
    )
  );
  stmts.push(
    userIns.bind(
      USER_TREVOR,
      "trevor.nakamura@example.com",
      "recipient",
      null,
      "Trevor Nakamura",
      "San Francisco",
      "CA",
      "casual_volunteer",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      now - 10 * DAY
    )
  );
  stmts.push(
    userIns.bind(
      USER_ANDRE, "andre.beaumont@example.com", "recipient", null, "André Beaumont",
      "San Francisco", "CA", "snap_cert", "André Beaumont", "0719902",
      addr({ line1: "655 Hayes Street", city: "San Francisco", state: "CA", zip: "94102" }),
      "1988-07-22", "(415) 555-0188", now - 20 * DAY, null, now - 20 * DAY, null, now - 25 * DAY
    )
  );
  stmts.push(
    userIns.bind(
      USER_LINH, "linh.tran@example.com", "recipient", null, "Linh Tran",
      "San Francisco", "CA", "snap_cert", "Linh Tran", "0723318",
      addr({ line1: "1530 Powell Street", city: "San Francisco", state: "CA", zip: "94133" }),
      "1995-11-02", "(415) 555-0173", now - 15 * DAY, null, now - 15 * DAY, null, now - 18 * DAY
    )
  );
  stmts.push(
    userIns.bind(USER_PRIYA, "priya.venkatesan@example.com", "org_member", "org_admin", "Priya Venkatesan",
      "San Francisco", "CA", "n/a", null, null, null, null, null, null, null, null, ORG_SFCDC, now - 110 * DAY)
  );
  stmts.push(
    userIns.bind(USER_DANIEL, "daniel.okafor@example.com", "org_member", "reviewer", "Daniel Okafor",
      "San Francisco", "CA", "n/a", null, null, null, null, null, null, null, null, ORG_FUF, now - 100 * DAY)
  );
  stmts.push(
    userIns.bind(USER_ADMIN, "alex.mercado@example.com", "admin", null, "Alex Mercado",
      "San Francisco", "CA", "n/a", null, null, null, null, null, null, null, null, null, now - 130 * DAY)
  );

  // ---- task templates ----
  const taskIns = db.prepare(
    `INSERT INTO task_templates (id, org_id, created_by_user_id, title, category, short_description,
      instructions_md, checklist_json, deliverable_spec_json, validation_rubric_md,
      est_hours, max_hours, location_kind, status, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  );
  for (const t of TASKS) {
    const createdBy = t.org_id === ORG_SFCDC ? USER_PRIYA : USER_DANIEL;
    stmts.push(
      taskIns.bind(
        t.id, t.org_id, createdBy, t.title, t.category, t.short_description,
        t.instructions_md, JSON.stringify(t.checklist), JSON.stringify(t.spec), t.rubric,
        t.est, t.max, t.location, "active", now - 90 * DAY
      )
    );
  }

  // ---- submissions ----
  const subIns = db.prepare(
    `INSERT INTO submissions (id, user_id, task_template_id, status, committed_at, first_started_at,
      submitted_at, reviewed_at, time_log_json, checklist_progress_json, user_notes,
      ai_verdict_json, reviewer_id, reviewer_notes, hours_credited)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  );

  const verdictApprove = JSON.stringify({
    verdict: "approve", confidence: 0.91,
    reasoning: "Photos show distinct street trees on a San Francisco block with daylight and sidewalk context. Condition notes are specific. Looks like genuine first-hand fieldwork.",
    issues: [], estimated_actual_hours: 3, suspected_ai_content: false,
  });
  const verdictTranslate = JSON.stringify({
    verdict: "approve", confidence: 0.74,
    reasoning: "Spanish translation covers all sections of the flyer and preserves structure. Minor phrasing could be smoothed but meaning is faithful.",
    issues: ["A few headings could read more naturally."], estimated_actual_hours: 2, suspected_ai_content: false,
  });
  const verdictNeeds = JSON.stringify({
    verdict: "reject", confidence: 0.66,
    reasoning: "The seminar pre-work is done, but the one-page public guide for neighbors — the actual deliverable — isn't written yet, so the submission is incomplete.",
    issues: ["Public guide not written", "No sharing location noted"], estimated_actual_hours: 1, suspected_ai_content: false,
  });

  // Marisol — 1 committed
  stmts.push(subIns.bind(
    "sub_m_committed", USER_MARISOL, TASK_INPUT, "committed", now - 2 * HOUR, null, null, null,
    "[]", "{}", null, null, null, null, null
  ));
  // Marisol — 1 in_progress
  stmts.push(subIns.bind(
    "sub_m_progress", USER_MARISOL, TASK_HAZARDS, "in_progress", now - 3 * DAY, now - 2 * DAY, null, null,
    JSON.stringify([{ start: now - 2 * DAY, end: now - 2 * DAY + 1.5 * HOUR }]),
    JSON.stringify({ find: true, photo: false, locate: true, severity: false }),
    "Got 6 of 10 so far — finishing the stretch along 24th St this weekend.", null, null, null, null
  ));
  // Marisol — 1 pending_review (translation, ~4h logged)
  stmts.push(subIns.bind(
    "sub_m_pending", USER_MARISOL, TASK_TRANSLATE, "pending_review", now - 2 * DAY, now - 2 * DAY,
    now - 1 * DAY, null,
    JSON.stringify([
      { start: now - 2 * DAY, end: now - 2 * DAY + 2 * HOUR },
      { start: now - 1 * DAY - 2 * HOUR, end: now - 1 * DAY },
    ]),
    JSON.stringify({ read: true, translate: true, format: true, proof: true }),
    "Traducción completa del folleto de salud pública. Mantuve los encabezados y los números de teléfono.",
    verdictTranslate, null, null, null
  ));
  // Marisol — 1 approved (document a community space, credited 3)
  stmts.push(subIns.bind(
    "sub_m_approved", USER_MARISOL, TASK_SPACE, "approved", now - 6 * DAY, now - 6 * DAY,
    now - 5 * DAY, now - 4 * DAY,
    JSON.stringify([{ start: now - 6 * DAY, end: now - 6 * DAY + 3 * HOUR }]),
    JSON.stringify({ visit: true, write: true, users: true, photo: true }),
    "Profile of Parque Niños Unidos on Folsom — heavily used by families after school.",
    JSON.stringify({ verdict: "approve", confidence: 0.88, reasoning: "Specific, first-hand 280-word profile with a photo.", issues: [], estimated_actual_hours: 3, suspected_ai_content: false }),
    USER_PRIYA, "Lovely, specific write-up. Approved at 3 hours.", 3
  ));
  // Marisol — 1 needs_changes (seminar)
  stmts.push(subIns.bind(
    "sub_m_needs", USER_MARISOL, TASK_SEMINAR, "needs_changes", now - 2 * DAY, now - 2 * DAY,
    now - 1 * DAY, now - 20 * HOUR,
    JSON.stringify([{ start: now - 2 * DAY, end: now - 2 * DAY + 1 * HOUR }]),
    JSON.stringify({ prework: true, watch: true, workbook: false, reflect: false }),
    "Watched the seminar, still need to write the one-page guide.", verdictNeeds, USER_PRIYA,
    "Thanks for getting started! Please finish the one-page plain-language guide and note where it'll be shared, then resubmit.", null
  ));

  // Two other recipients — pending_review on the tree census (FUF queue)
  stmts.push(subIns.bind(
    "sub_a_pending", USER_ANDRE, TASK_TREES, "pending_review", now - 3 * DAY, now - 3 * DAY,
    now - 30 * HOUR, null,
    JSON.stringify([{ start: now - 3 * DAY, end: now - 3 * DAY + 2.5 * HOUR }]),
    JSON.stringify({ walk: true, species: true, condition: true, photos: true, gaps: true }),
    "Counted 14 trees on the 600 block of Hayes — mostly London plane, two ginkgos.",
    verdictApprove, null, null, null
  ));
  stmts.push(subIns.bind(
    "sub_l_pending", USER_LINH, TASK_TREES, "pending_review", now - 1 * DAY, now - 1 * DAY,
    now - 8 * HOUR, null,
    JSON.stringify([{ start: now - 1 * DAY, end: now - 1 * DAY + 2 * HOUR }]),
    JSON.stringify({ walk: true, species: true, condition: true, photos: true, gaps: false }),
    "North Beach block — lots of street trees lifting the sidewalk near Powell.",
    JSON.stringify({ verdict: "approve", confidence: 0.83, reasoning: "Clear photos of distinct trees with condition notes.", issues: [], estimated_actual_hours: 2.5, suspected_ai_content: false }),
    null, null, null
  ));

  // ---- submission files (metadata only; R2 objects may be absent → placeholder served) ----
  const fileIns = db.prepare(
    `INSERT INTO submission_files (id, submission_id, kind, r2_key, metadata_json) VALUES (?,?,?,?,?)`
  );
  const photoMeta = (lat: number, lng: number, hash: string) =>
    JSON.stringify({ mime: "image/jpeg", geo: { lat, lng }, captured_at: now - 3 * DAY, sha256: hash });
  for (const [sid, n] of [["sub_a_pending", 3], ["sub_l_pending", 3], ["sub_m_approved", 1]] as const) {
    for (let i = 0; i < n; i++) {
      stmts.push(fileIns.bind(
        `file_${sid}_${i}`, sid, "photo",
        `submissions/${sid}/seed-${i}.jpg`,
        photoMeta(37.7749 + i * 0.001, -122.4194 - i * 0.001, `seedhash_${sid}_${i}`)
      ));
    }
  }

  // ---- hours ledger (Marisol: certified 8 this month via SFCDC) ----
  const ledgerIns = db.prepare(
    `INSERT INTO hours_ledger (id, user_id, month, total_hours, certified_org_id) VALUES (?,?,?,?,?)`
  );
  stmts.push(ledgerIns.bind("ledger_m_sfcdc", USER_MARISOL, month, 8, ORG_SFCDC));

  // ---- flags: the tree-census pending submissions are clean ("No flags raised") ----
  // (No flag rows inserted for seed; the review screen shows "No flags raised".)

  await db.batch(stmts);
}

/** Seed only if the database is empty (first-run bootstrap). */
export async function ensureSeeded(db: D1Database, now: number = Date.now()): Promise<void> {
  const row = await db.prepare("SELECT COUNT(*) AS n FROM users").first<{ n: number }>();
  if (!row || row.n === 0) {
    await seedDatabase(db, now);
  }
}
