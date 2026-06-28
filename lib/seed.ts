/**
 * Idempotent seed: wipes every table and reinserts the sample dataset.
 * Used by /admin/reset and the first-run bootstrap (DEMO_MODE only).
 *
 * Sample-data notes:
 * - Two task orgs: Civic Data Collective and Canopy Commons (both illustrative).
 * - A sample recipient commits to the tree census (Canopy Commons's task), so the
 *   reviewer who closes the loop is its reviewer (Daniel Okafor). That queue is
 *   seeded with 2 other pending submissions so it reads "3 awaiting" once the
 *   recipient submits. (An org can only review its own tasks, so it
 *   uses the task's org — see README.)
 */
import { parseJson, totalLoggedHours, type ChecklistItem, type DeliverableSpec, type TimeLogSession } from "./types";
import { hashPassword } from "./auth";
import { EMS_TARGETS } from "./ems-targets";
import { ORG_CITIZEN_SCIENCE } from "./zooniverse";

/** All seeded sample accounts share this password so they are loginnable. */
export const SEED_PASSWORD = "colift-sample-2026";

export interface Persona {
  user_id: string;
  label: string;
  sublabel: string;
  role: "recipient" | "org_member" | "admin";
}

// ---- stable ids ----
export const ORG_SFCDC = "org_sfcdc";
export const ORG_FUF = "org_fuf";
export const ORG_FOOD = "org_food_access";
export const ORG_GOV = "org_gov_digital";

// External directory orgs
export const ORG_HABITAT = "org_habitat";
export const ORG_REDCROSS = "org_redcross";
export const ORG_FEEDING = "org_feeding_america";
export const ORG_MOW = "org_meals_wheels";
export const ORG_SIERRA = "org_sierra_club";
export const ORG_AUDUBON = "org_audubon";
export const ORG_BBBS = "org_big_brothers";
export const ORG_PROLITERACY = "org_proliteracy";
export const ORG_HUMANE = "org_humane";
export const ORG_TWB = "org_twb";

export const USER_MARISOL = "user_marisol";
export const USER_TREVOR = "user_trevor";
export const USER_PRIYA = "user_priya";
export const USER_DANIEL = "user_daniel";
export const USER_ADMIN = "user_admin";
export const USER_ANDRE = "user_andre";
export const USER_LINH = "user_linh";
export const USER_HANA = "user_hana";

export const TASK_ZOONIVERSE = "task_zooniverse";

export const TASK_TREES = "task_trees";
export const TASK_TRANSLATE = "task_translate";
export const TASK_HAZARDS = "task_hazards";
export const TASK_SPACE = "task_space";
export const TASK_INPUT = "task_input";
export const TASK_SEMINAR = "task_seminar";
export const TASK_FOOD_AUDIT = "task_food_audit";
export const TASK_GOV_AUDIT = "task_gov_audit";
export const TASK_EMS_RATES = "task_ems_rates";

export const PERSONAS: Persona[] = [
  { user_id: USER_MARISOL, label: "Marisol Reyes", sublabel: "Recipient · certifies SNAP hours", role: "recipient" },
  { user_id: USER_TREVOR, label: "Trevor Nakamura", sublabel: "Recipient · volunteer only", role: "recipient" },
  { user_id: USER_DANIEL, label: "Daniel Okafor", sublabel: "Canopy Commons · reviewer", role: "org_member" },
  { user_id: USER_HANA, label: "Hana Ishikawa", sublabel: "colift Citizen Science · reviewer", role: "org_member" },
  { user_id: USER_PRIYA, label: "Priya Venkatesan", sublabel: "Civic Data Collective · admin", role: "org_member" },
  { user_id: USER_ADMIN, label: "Alex Mercado", sublabel: "colift · admin", role: "admin" },
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
  /** ms-since-epoch offset from now; defaults to -90 days if omitted */
  createdAtOffset?: number;
  /** ms-since-epoch absolute close date; null = open-ended */
  closesAtOffset?: number | null;
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
      "## What you'll do\nStreet trees cool the sidewalk, clean the air, and need regular eyes on them. Walk one block and record what's there.\n\n1. Pick a block you can reach on foot.\n2. Walk **both sides**, end to end.\n3. For each tree, note the **species** (a best guess is fine), the **trunk size** (skinny / medium / thick), and any **visible problems** (broken limbs, lifting sidewalk, dead branches).\n4. Photograph at least **3** trees clearly.\n5. Mark any **empty basins or stumps** where a tree could go.\n\n## What the org gets\nCanopy Commons folds your block into the regional tree inventory used to schedule pruning and new plantings.",
    checklist: [
      { id: "walk", label: "Walk both sides of the block, end to end", required: true },
      { id: "species", label: "Note a species (or best guess) for each tree", required: true },
      { id: "condition", label: "Record trunk size and visible condition", required: true },
      { id: "photos", label: "Photograph at least 3 trees", required: true },
      { id: "gaps", label: "Mark empty basins or stumps", required: false },
    ],
    spec: { kind: "data-collection", min_photos: 3, require_geotag: true },
    rubric:
      "A complete submission includes at least 3 clear, original photos of distinct street trees, plus notes covering species guesses and condition for the block. Photos should look like real on-the-ground phone photos (sidewalk, foliage, daylight). Flag if photos are stock-like, duplicated, or clearly not of street trees. Reject if there are fewer than 3 photos or no condition notes.",
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
      "## What you'll do\nWe'll give you the English text of a public-health flyer. Translate the whole thing into Spanish that a general audience can read easily.\n\n1. Read the source text all the way through first.\n2. Translate **every** section — don't skip headings or the fine print.\n3. Keep the structure (headings, bullets, phone numbers).\n4. Proofread for tone and accuracy.\n\n## What the org gets\nCivic Data Collective distributes translated notices to community organizations.",
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
      "Document ten trip hazards, blocked curb ramps, or broken sidewalks in your area so they can be reported to the city.",
    instructions_md:
      "## What you'll do\nMany sidewalk hazards never get reported. Find ten and document them.\n\n1. Walk your area and spot **10** distinct hazards (lifted slabs, blocked curb ramps, deep cracks, missing grates).\n2. Photograph **each one** clearly.\n3. Note the nearest cross-streets and a one-line severity note.\n\n## What the org gets\nCivic Data Collective bundles your reports for the city's service-request system and tracks which get fixed.",
    checklist: [
      { id: "find", label: "Identify 10 distinct hazards", required: true },
      { id: "photo", label: "Photograph each hazard", required: true },
      { id: "locate", label: "Note nearest cross-streets for each", required: true },
      { id: "severity", label: "Add a one-line severity note for each", required: true },
    ],
    spec: { kind: "data-collection", min_photos: 10, require_geotag: true },
    rubric:
      "A complete submission has 10 clear, distinct, original photos of real sidewalk hazards, each with a location and severity note. Flag duplicates, stock imagery, or geotags far from the submitted location. Reject if fewer than 10 distinct hazards are documented.",
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
      "## What you'll do\nWrite a short profile of a shared space in your area.\n\n1. Spend time at a park, plaza, library, or community garden.\n2. Write **at least 250 words**: what the space is, who uses it, what's working, and what it needs.\n3. Include **one** photo.\n\n## What the org gets\nCivic Data Collective uses these profiles in community needs assessments.",
    checklist: [
      { id: "visit", label: "Spend time at the space in person", required: true },
      { id: "write", label: "Write at least 250 words", required: true },
      { id: "users", label: "Describe who uses the space", required: true },
      { id: "photo", label: "Attach one photo", required: true },
    ],
    spec: { kind: "neighborhood-writing", min_words: 250, min_photos: 1 },
    rubric:
      "A complete submission is a 250+ word, specific, first-hand profile of a real community space, with one photo. Flag generic writing that could describe anywhere, or text that reads as AI-generated. Reject if under the word count or missing the photo.",
    est: 2,
    max: 4,
    location: "in_person",
  },
  {
    id: TASK_INPUT,
    org_id: ORG_SFCDC,
    title: "Civic input: how should the city spend $100k?",
    category: "civic-input",
    short_description:
      "Weigh in on a participatory-budgeting question. Rank priorities and explain your top choice in a few sentences.",
    instructions_md:
      "## What you'll do\nThe city has $100,000 in participatory-budget funds. Tell us where it should go.\n\n1. Review the five options.\n2. Rank them.\n3. Explain your **top choice** in 3–5 sentences.\n\n## What the org gets\nCivic Data Collective aggregates responses into a summary shared with the city council.",
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
      "## What you'll do\nLearn the material, then make something useful for other people with it. The guide — not the watching — is the point.\n\n1. Complete the **pre-work** reflection.\n2. Watch the full recorded seminar.\n3. Write a **one-page, plain-language money-help guide** for neighbors — the public deliverable.\n4. Note where it will be shared (a partner library or community center).\n\n## What the org gets\nCivic Data Collective donates the finished guides to a partner library so **other residents** can use them. The seminar is the input; the free public guide is the output.",
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
  {
    id: TASK_FOOD_AUDIT,
    org_id: ORG_FOOD,
    title: "Audit food prices at a store near you",
    category: "food-audit",
    short_description:
      "Visit any food retailer and capture shelf-tag prices for 6 staples (milk, eggs, bread, rice, beans, bananas). You decide how many stores you do — hours credit based on items documented plus round-trip commute from home.",
    instructions_md:
      "## What you'll do\nWalk into any food retailer — supermarket, bodega, ethnic market, dollar store, farmers market — and capture **shelf-tag prices** for the 6 staple items. You don't buy anything.\n\n1. Find a store.\n2. For each of the 6 items, snap **one photo** of the item next to its shelf tag, then enter the price and size.\n3. If an item is missing, mark it out-of-stock.\n4. Submit. Hours credit when your audit verifies.\n\n## What you get out of it\nVerified audits flow into a public food-access dataset showing where food is most affordable. The deliverable is free and public. Your time is credited against your SNAP work-requirement hours.",
    checklist: [
      { id: "store", label: "Pick a retailer", required: true },
      { id: "basket", label: "Capture price + photo for each of the 6 items (or mark out-of-stock)", required: true },
      { id: "ebt", label: "Note whether the store appears to accept EBT", required: true },
    ],
    spec: { kind: "food-audit", basket_template_id: "usda-thrifty-6", require_geotag: true },
    rubric:
      "A complete audit captures price and a clear photo for every in-stock basket item, taken inside a real food retailer. The photo should clearly show the item and its shelf price tag side by side. Flag missing photos, illegible tags, prices wildly outside expected bands, or EXIF geotags inconsistent with the claimed store location. Reject if photos are stock-like, duplicated across audits, or clearly not of the claimed item.",
    est: 0.2,
    max: 0.25,
    location: "in_person",
    createdAtOffset: 30 * DAY,
    closesAtOffset: null,
  },
  {
    id: TASK_GOV_AUDIT,
    org_id: ORG_GOV,
    title: "Audit a government, nonprofit, or public website",
    category: "gov-audit",
    short_description:
      "From your computer, pick any government, nonprofit, or public-service website — your city's, your state's, a public library, a community clinic — and run a short, guided usability and accessibility audit inside the browser. No prior training needed; each check has a one-line instruction. Your findings publish to a free public dataset.",
    instructions_md:
      "## What you'll do\nThis is a **desktop task** — accessibility checks like keyboard navigation and 200% zoom need a real keyboard and screen.\n\n1. **Pick any page worth auditing** — your city or county site, a state agency, a public library or transit agency, a 501(c)(3) nonprofit, a community clinic, or any other public-facing site that residents in your area rely on.\n2. Browse to it inside the embedded browser, then **lock it as your anchor**. You can explore the whole site freely; the page you're rating stays pinned and one click away.\n3. Answer a short **site-level** check once, then a **page-level** rubric for the anchor: a few pass/fail accessibility items (each with a one-line how-to), four 1–5 ratings, and (optionally) three short questions — what you were trying to do, what got in the way, and one concrete fix.\n4. Submit. The server runs automated accessibility checks (axe-core) on the same page to corroborate your findings.\n5. When you're done, you can **audit another URL** — each audit adds another row of public usability data.\n\n## What you get out of it\nYour audit joins a **free public dataset** of website usability findings — actionable feedback for the people who run these pages, and a public good. Your time is credited toward your SNAP work-requirement hours once the audit is reviewed.",
    checklist: [
      { id: "find", label: "Pick a page worth auditing and lock it as your anchor", required: true },
      { id: "site", label: "Answer the site-level checks once", required: true },
      { id: "page", label: "Complete the page-level rubric (observables + 1–5 ratings)", required: true },
    ],
    spec: {
      kind: "gov-audit",
      target_descriptor: "any government, nonprofit, or public-service website worth auditing",
      target_url: "",
    },
    rubric:
      "A complete audit locks a chosen page as the anchor, answers every observable accessibility sub-check (alt text, keyboard nav, contrast, 200% zoom) plus task-completion and maintained, and gives all four 1–5 ratings. Free-text answers are optional. Corroborate the self-reported accessibility rating against the server-side axe-core result: a 'pass' rating against many automated violations lowers integrity and flags for review. Reject straight-lined batteries (identical ratings with empty/garbage text), sessions on non-desktop devices, and any anchor that points to a site outside the gov / nonprofit / public-service scope (e.g. social media profiles, blogs, e-commerce pages).",
    est: 0.25,
    max: 0.33,
    location: "online",
    createdAtOffset: 60 * DAY,
    closesAtOffset: null,
  },
  {
    id: TASK_EMS_RATES,
    org_id: ORG_SFCDC,
    title: "Find ambulance rates for one EMS provider",
    category: "ems-rate-research",
    short_description:
      "Look up the official published ambulance billing rates for one assigned EMS provider, record the dollar amounts in a short structured form, and upload a screenshot of the source. Takes about 30 minutes.",
    instructions_md:
      "## What you'll do\nAmbulance billing rates are public but scattered across city ordinances, county fee schedules, and provider PDFs. Help build a free national dataset by pinning down the rates for one provider.\n\n1. Search for the provider's **official** fee schedule — city site, county site, the provider's own site, or a state regulator. Not a news article or blog.\n2. Find the **dollar amounts** for as many of these as the source lists: BLS base, ALS base, per-mile, and treat-no-transport (TNT).\n3. Note the **effective date** of the rates.\n4. **Screenshot** the rate table from the source.\n5. Paste the direct URL into the form and submit.\n\n## What the public gets\nYour entry joins a free CSV/JSON of US ambulance rates anyone can download — patients, journalists, and researchers checking whether a bill is in line with the published schedule.",
    checklist: [
      { id: "source", label: "Find the provider's official rate schedule from an authoritative source", required: true },
      { id: "rate", label: "Record at least one rate (BLS, ALS, mileage, or TNT)", required: true },
      { id: "url", label: "Paste the direct URL to the source document", required: true },
      { id: "screenshot", label: "Upload a screenshot of the rate schedule table", required: true },
      { id: "date", label: "Enter the effective date of the rates", required: true },
      { id: "zips", label: "Note the ZIP codes or service area if listed", required: false },
      { id: "tnt", label: "Check whether a Treatment-Without-Transport (TNT) fee exists", required: false },
    ],
    spec: {
      kind: "ems-rate-research",
      ems_targets: EMS_TARGETS,
    },
    rubric:
      "APPROVE if: source_url is present and from an official government or EMS-provider domain; at least one rate field (bls_base / als_base / mileage / tnt_fee) is non-empty; the screenshot shows a real rate table with dollar figures; effective_date is present. NEEDS_CHANGES if: source_url is a homepage rather than the direct schedule, all rate fields are empty, tnt_fee is filled but tnt_description is empty, or the screenshot shows an unrelated page. REJECT if: source is a personal blog / news article / Reddit / unofficial source, the screenshot is blank / AI-generated / unrelated, or provider_name + city + state are all empty. Field issues use the field name as the key (source_url, photos, overall).",
    est: 0.5,
    max: 0.5,
    location: "online",
    createdAtOffset: 5 * DAY,
    closesAtOffset: null,
  },
];

interface ExternalTask {
  id: string;
  org_id: string;
  title: string;
  category: string;
  short_description: string;
  instructions_md: string;
  est: number;
  max: number;
  location: "online" | "in_person" | "hybrid";
  external_url: string;
  createdAtOffset: number;
}

const EXTERNAL_TASKS: ExternalTask[] = [
  // Habitat for Humanity
  {
    id: "ext_habitat_build",
    org_id: ORG_HABITAT,
    title: "Build affordable housing in your community",
    category: "community-service",
    short_description: "Swing a hammer, frame walls, or install flooring alongside experienced crew chiefs — no construction experience needed. Habitat builds and repairs homes for families who couldn't otherwise afford them.",
    instructions_md: "## About this opportunity\nHabitat for Humanity chapters nationwide run regular build days open to volunteers with no prior construction experience. Crew chiefs walk you through every task.\n\n## What to expect\n- Shifts typically run 7 a.m.–3 p.m. on weekdays and Saturdays\n- Bring close-toed shoes, water, and sunscreen — tools and lunch are often provided\n- Build sites are indoors and outdoors depending on the project phase\n\n## How to sign up\nFind your local affiliate and available dates on the Habitat website. First-timers can attend a brief orientation the morning of.",
    est: 6,
    max: 8,
    location: "in_person",
    external_url: "https://www.habitat.org/volunteer",
    createdAtOffset: 12 * 86_400_000,
  },
  {
    id: "ext_habitat_restore",
    org_id: ORG_HABITAT,
    title: "Sort donated goods at a Habitat ReStore",
    category: "community-service",
    short_description: "Help accept, sort, and display donated furniture, appliances, and building materials at your local Habitat ReStore. Sales from these goods fund new home builds in your area.",
    instructions_md: "## About this opportunity\nHabitat ReStores are nonprofit home improvement stores that accept and resell donated building materials. Volunteers help receive donations, clean and price items, and keep the floor organized.\n\n## What to expect\n- Shifts are usually 3–4 hours, mornings or afternoons\n- Light to moderate lifting — some heavy items, team lifting always available\n- No experience required; staff will show you the ropes\n\n## How to sign up\nFind your nearest ReStore and open volunteer shifts on the Habitat website.",
    est: 3,
    max: 4,
    location: "in_person",
    external_url: "https://www.habitat.org/restores/volunteer",
    createdAtOffset: 8 * 86_400_000,
  },
  // American Red Cross
  {
    id: "ext_redcross_blood",
    org_id: ORG_REDCROSS,
    title: "Volunteer at a blood drive near you",
    category: "community-service",
    short_description: "Register donors, answer questions, and provide refreshments at a local Red Cross blood drive. Your shift helps ensure hospitals have the supply they need.",
    instructions_md: "## About this opportunity\nThe Red Cross relies on volunteers at blood drives to keep operations running smoothly. Roles include greeting and registering donors, answering common questions, and manning the refreshment area after donation.\n\n## What to expect\n- Shifts run 4–6 hours at community venues (schools, churches, offices)\n- Training is brief — usually 30 minutes at the start of your first shift\n- No medical background required\n\n## How to sign up\nCreate a Red Cross volunteer account and search for local blood drives in your area.",
    est: 4,
    max: 6,
    location: "in_person",
    external_url: "https://www.redcross.org/volunteer/volunteer-opportunities/blood-drive-volunteer.html",
    createdAtOffset: 5 * 86_400_000,
  },
  {
    id: "ext_redcross_disaster",
    org_id: ORG_REDCROSS,
    title: "Train as a disaster relief volunteer",
    category: "community-service",
    short_description: "Train to respond to local disasters — house fires, floods, and severe weather — as part of a Red Cross disaster action team. Training takes about 8 hours and can be split across online modules and an in-person session.",
    instructions_md: "## About this opportunity\nRed Cross Disaster Action Teams respond within hours when homes are destroyed by fire or communities are hit by floods and storms. Volunteers provide emergency food, shelter referrals, and direct financial assistance.\n\n## What to expect\n- Initial training: ~8 hours (mix of online self-paced + in-person)\n- After training, volunteers are on-call for local responses (2–4 hrs each)\n- Open to adults 18+; no prior experience required\n\n## How to sign up\nRegister on the Red Cross website and select Disaster Relief as your area of interest. Local chapters will contact you about your nearest training.",
    est: 8,
    max: 12,
    location: "hybrid",
    external_url: "https://www.redcross.org/volunteer/volunteer-opportunities/disaster-relief.html",
    createdAtOffset: 20 * 86_400_000,
  },
  // Feeding America
  {
    id: "ext_feeding_sort",
    org_id: ORG_FEEDING,
    title: "Sort and pack groceries at a local food bank",
    category: "community-service",
    short_description: "Inspect, sort, and box donated food at a Feeding America member food bank in your area. Shifts typically run 3–4 hours and are available mornings and afternoons throughout the week.",
    instructions_md: "## About this opportunity\nFeeding America's network of 200 food banks serves every county in the United States. Volunteers in the warehouse sort donations by type and expiration, repack bulk goods into family-size portions, and load pallets for distribution.\n\n## What to expect\n- Shifts are 3–4 hours; some locations offer evenings and weekends\n- Light to moderate standing and lifting\n- Groups welcome — great for families with kids 8+\n\n## How to sign up\nFind your nearest Feeding America food bank and browse open volunteer shifts.",
    est: 3,
    max: 4,
    location: "in_person",
    external_url: "https://www.feedingamerica.org/take-action/volunteer",
    createdAtOffset: 7 * 86_400_000,
  },
  {
    id: "ext_feeding_pantry",
    org_id: ORG_FEEDING,
    title: "Distribute food at a mobile pantry",
    category: "community-service",
    short_description: "Load, transport, and hand out boxes of groceries at a pop-up distribution site in a neighborhood with limited grocery access. Events are usually on weekends and run 2–4 hours.",
    instructions_md: "## About this opportunity\nMobile pantries bring food directly to neighborhoods that don't have easy access to a food bank or grocery store. Volunteers help set up the distribution site, carry boxes, and assist neighbors as they select items.\n\n## What to expect\n- Events run 2–4 hours, typically early morning through midday\n- Moderate lifting and outdoor standing\n- Spanish speakers especially welcome at many sites\n\n## How to sign up\nSearch for mobile pantry volunteer events at your nearest Feeding America member food bank.",
    est: 3,
    max: 4,
    location: "in_person",
    external_url: "https://www.feedingamerica.org/take-action/volunteer",
    createdAtOffset: 15 * 86_400_000,
  },
  // Meals on Wheels
  {
    id: "ext_mow_deliver",
    org_id: ORG_MOW,
    title: "Deliver meals to homebound seniors in your area",
    category: "community-service",
    short_description: "Pick up a route of prepared meals and deliver them to older adults who can't leave home. It's a wellness check as much as a delivery — volunteers are often the only person a recipient sees that day.",
    instructions_md: "## About this opportunity\nMore than 5,000 local Meals on Wheels programs serve every community in America. Volunteer drivers pick up hot or frozen meals and deliver them on a regular weekly route — usually 1–2 hours per shift.\n\n## What to expect\n- Routes run on weekday mornings; some programs have weekend options\n- You'll need a valid driver's license and a reliable vehicle\n- Orientation takes about 30 minutes; your first route is shadowed\n\n## How to sign up\nEnter your ZIP code on the Meals on Wheels website to find your nearest local program and available routes.",
    est: 2,
    max: 3,
    location: "in_person",
    external_url: "https://www.mealsonwheelsamerica.org/volunteer",
    createdAtOffset: 10 * 86_400_000,
  },
  // Sierra Club
  {
    id: "ext_sierra_trail",
    org_id: ORG_SIERRA,
    title: "Join a trail restoration crew",
    category: "data-collection",
    short_description: "Clear invasive plants, repair erosion damage, and restore native vegetation on a local hiking trail. Sierra Club outings run on weekends and supply all tools — just bring water and work gloves.",
    instructions_md: "## About this opportunity\nSierra Club chapters run trail maintenance outings throughout the year. Volunteers work alongside trained leaders on tasks like removing invasive species, stabilizing eroded sections, and planting native seedlings.\n\n## What to expect\n- Outings run 4–6 hours, usually Saturday mornings\n- All tools provided; wear sturdy shoes and layered clothes\n- Light to moderate physical activity; no experience required\n\n## How to sign up\nBrowse local Sierra Club chapter outings and filter by trail maintenance or habitat restoration.",
    est: 4,
    max: 6,
    location: "in_person",
    external_url: "https://www.sierraclub.org/volunteer",
    createdAtOffset: 18 * 86_400_000,
  },
  {
    id: "ext_sierra_water",
    org_id: ORG_SIERRA,
    title: "Help monitor a local creek or waterway",
    category: "data-collection",
    short_description: "Collect water samples, survey plant and animal life, and record findings on a standardized form. Your data joins a statewide baseline for tracking watershed health over time.",
    instructions_md: "## About this opportunity\nSierra Club watershed monitoring programs train volunteers to collect baseline data on local creeks, rivers, and wetlands. Your readings contribute to a long-term dataset used by water agencies and land trusts.\n\n## What to expect\n- Monitoring sessions run 2–4 hours\n- Training provided at your first session (~1 hour)\n- Waterproof shoes strongly recommended\n\n## How to sign up\nSearch for water monitoring or watershed volunteer events through your local Sierra Club chapter.",
    est: 3,
    max: 4,
    location: "in_person",
    external_url: "https://www.sierraclub.org/volunteer",
    createdAtOffset: 25 * 86_400_000,
  },
  // Audubon
  {
    id: "ext_audubon_count",
    org_id: ORG_AUDUBON,
    title: "Participate in a community bird count",
    category: "data-collection",
    short_description: "Walk a pre-assigned route, identify bird species, and submit your tally to eBird. Your count contributes to the longest-running wildlife census in North America.",
    instructions_md: "## About this opportunity\nThe Audubon Society runs community science programs year-round, including the Christmas Bird Count, the Great Backyard Bird Count, and local breeding bird atlases. No birding experience needed — beginner-friendly outings are always available.\n\n## What to expect\n- Morning outings, typically 3–5 hours\n- Grouped with an experienced birder who helps with identifications\n- Binoculars helpful but not required (loaners sometimes available)\n\n## How to sign up\nBrowse community science events on the Audubon website or your local chapter's calendar.",
    est: 3,
    max: 5,
    location: "in_person",
    external_url: "https://www.audubon.org/conservation/community-science",
    createdAtOffset: 9 * 86_400_000,
  },
  {
    id: "ext_audubon_habitat",
    org_id: ORG_AUDUBON,
    title: "Survey local habitat for nesting and migration activity",
    category: "data-collection",
    short_description: "Visit a local park or marsh at dawn and record what you observe. Audubon uses these surveys to track how bird populations respond to urban development and climate change.",
    instructions_md: "## About this opportunity\nPoint count surveys are the standard method for monitoring bird populations. Volunteers stand at fixed points for a set time and record every bird seen or heard. Data is submitted through eBird and incorporated into regional analyses.\n\n## What to expect\n- Surveys run early morning (30–90 minutes per point)\n- Training session before your first outing covers the protocol\n- All ages welcome; great beginner introduction to field ornithology\n\n## How to sign up\nContact your nearest Audubon chapter or search for monitoring programs in your region.",
    est: 2,
    max: 4,
    location: "in_person",
    external_url: "https://www.audubon.org/conservation/community-science",
    createdAtOffset: 30 * 86_400_000,
  },
  // Big Brothers Big Sisters
  {
    id: "ext_bbbs_mentor",
    org_id: ORG_BBBS,
    title: "Become a mentor for a young person in your community",
    category: "community-service",
    short_description: "Spend time with a child or teenager — shooting hoops, doing homework, visiting a museum, or just talking. Bigs and Littles are matched based on shared interests.",
    instructions_md: "## About this opportunity\nBig Brothers Big Sisters matches adult volunteers (Bigs) with children ages 5–21 (Littles) for one-on-one mentoring. Mentors commit to meeting regularly for at least one year.\n\n## What to expect\n- Community-based: you and your Little decide what to do together (outings, activities, homework help)\n- Site-based: meetings happen at a school or community center on a set schedule\n- Time commitment: ~2–4 hours twice a month minimum\n\n## How to sign up\nApply on the BBBS website. The process includes an application, interview, background check, and a matching meeting.",
    est: 4,
    max: 4,
    location: "hybrid",
    external_url: "https://www.bbbs.org/volunteer/",
    createdAtOffset: 14 * 86_400_000,
  },
  // ProLiteracy
  {
    id: "ext_pro_tutor",
    org_id: ORG_PROLITERACY,
    title: "Tutor an adult learner in reading and writing",
    category: "community-service",
    short_description: "Work one-on-one with an adult who is learning to read. ProLiteracy will match you with a local program near you and provide free tutor training before your first session.",
    instructions_md: "## About this opportunity\nProLiteracy is the largest adult literacy organization in the United States. Volunteer tutors are matched with adult learners at local member programs and typically meet once or twice a week.\n\n## What to expect\n- Free tutor training (~6 hours) before you're matched with a learner\n- Sessions are 1–2 hours; you and your learner set the schedule\n- Materials provided by the local program\n\n## How to sign up\nEnter your ZIP code on the ProLiteracy website to find a member program near you, then apply as a volunteer tutor.",
    est: 2,
    max: 3,
    location: "in_person",
    external_url: "https://proliteracy.org/get-involved/volunteer/",
    createdAtOffset: 22 * 86_400_000,
  },
  {
    id: "ext_pro_esl",
    org_id: ORG_PROLITERACY,
    title: "Help someone build basic English skills online",
    category: "community-service",
    short_description: "Teach conversational English in a video or text session with an adult learner — recent immigrants, refugees, or long-time residents building their skills for work. Flexible scheduling; ProLiteracy coordinates the match.",
    instructions_md: "## About this opportunity\nPro-Literacy connects English language learners with volunteer tutors for online instruction. Sessions focus on everyday conversational skills, workplace vocabulary, or reading basics, depending on the learner's goals.\n\n## What to expect\n- Sessions are 1–2 hours via video call or messaging\n- You set your own availability — 1–2 sessions per week is typical\n- Free onboarding and materials from the coordinating program\n\n## How to sign up\nApply through ProLiteracy's online volunteer portal and indicate you're available for remote ESL instruction.",
    est: 2,
    max: 3,
    location: "online",
    external_url: "https://proliteracy.org/get-involved/volunteer/",
    createdAtOffset: 35 * 86_400_000,
  },
  // Humane Society
  {
    id: "ext_humane_shelter",
    org_id: ORG_HUMANE,
    title: "Walk dogs and socialize cats at a local shelter",
    category: "community-service",
    short_description: "Spend time with dogs and cats waiting to be adopted — walks, play sessions, and socialization improve their wellbeing and adoption chances. Most shelters need regular volunteers on weekday mornings.",
    instructions_md: "## About this opportunity\nAnimal shelters rely on volunteers to provide daily exercise, enrichment, and human contact to animals waiting for homes. Volunteers walk dogs, play with cats, and help with basic care tasks.\n\n## What to expect\n- Shifts run 2–3 hours; morning slots are most common\n- Orientation is required before your first shift (~1 hour)\n- Physical requirements: walking, light lifting, comfortable with dogs and cats\n\n## How to sign up\nFind your nearest Humane Society or ASPCA affiliate and apply through their volunteer portal.",
    est: 2,
    max: 3,
    location: "in_person",
    external_url: "https://www.humanesociety.org/resources/volunteering-humane-society",
    createdAtOffset: 6 * 86_400_000,
  },
  {
    id: "ext_humane_foster",
    org_id: ORG_HUMANE,
    title: "Foster a shelter animal in your home",
    category: "community-service",
    short_description: "Open your home to a dog, cat, or small animal while they recover, socialize, or wait for the right adopter. The shelter provides food, supplies, and vet care — you provide a safe, loving space.",
    instructions_md: "## About this opportunity\nFostering removes animals from the stress of shelter life, often for a few days to a few weeks. Foster families help animals recover from illness or surgery, build confidence, or simply wait in a calmer environment.\n\n## What to expect\n- Commitment: anywhere from a few days to several weeks per animal\n- All supplies and vet care covered by the shelter\n- You return the animal when they're adopted or when your foster period ends\n- Prior pet experience preferred but not required\n\n## How to sign up\nApply as a foster volunteer through your nearest Humane Society affiliate. Some programs accept applications year-round; others open them seasonally.",
    est: 10,
    max: 14,
    location: "in_person",
    external_url: "https://www.humanesociety.org/resources/volunteering-humane-society",
    createdAtOffset: 28 * 86_400_000,
  },
  // Translators Without Borders
  {
    id: "ext_twb_translate",
    org_id: ORG_TWB,
    title: "Translate humanitarian content for crisis response",
    category: "translation",
    short_description: "Translate short texts for disaster response, public health campaigns, and refugee assistance — from and into any of dozens of language pairs. TWB matches volunteers with projects that fit their languages and availability.",
    instructions_md: "## About this opportunity\nTranslators Without Borders (TWB) is a nonprofit that provides language services for humanitarian organizations. Volunteer translators work on projects from health agencies, disaster relief organizations, and refugee support groups.\n\n## What to expect\n- Projects are short (typically 250–2,000 words) with flexible deadlines\n- Work entirely online at your own pace\n- Language test required before acceptance (assesses translation quality, not just fluency)\n\n## How to sign up\nApply on the TWB volunteer portal, select your language pairs, and complete the qualification assessment.",
    est: 3,
    max: 6,
    location: "online",
    external_url: "https://translatorswithoutborders.org/volunteer/",
    createdAtOffset: 16 * 86_400_000,
  },
];

function addr(o: { line1: string; line2?: string; city: string; state: string; zip: string }) {
  return JSON.stringify(o);
}

type Stmt = D1PreparedStatement;

export async function seedDatabase(db: D1Database, now: number = Date.now()): Promise<void> {
  const month = ym(now);

  // ---- wipe (children before parents; remote D1 enforces foreign keys) ----
  const wipeTables = [
    "open_prices_contributions",
    "gov_audit_auto_checks",
    "gov_audit_page_evaluations",
    "gov_audit_site_evaluations",
    "gov_audit_sessions",
    "audit_validation_flags",
    "audit_photo_exif",
    "audit_photos",
    "audit_item_captures",
    "audit_public_summaries",
    "audits",
    "stores",
    "basket_templates",
    "volunteer_trust",
    "zooniverse_public_activity",
    "certificate_reviews",
    "external_project_catalog",
    "submission_flags",
    "submission_files",
    "cf888_forms",
    "hours_ledger",
    "submissions",
    "notifications",
    "sessions",
    "auth_tokens",
    "org_invites",
    "feedback",
    "task_templates",
    "audit_log",
    "users",
    "orgs",
    "counties",
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
      "civic-data-collective",
      "Civic Data Collective",
      "84-1234567",
      "partners@civicdata.org",
      null,
      "We turn local observations into open data that public agencies and community groups can act on. Volunteers map hazards, translate notices, and document public spaces.",
      addr({ line1: "2940 Capitol Avenue", line2: "Suite 200", city: "Sacramento", state: "CA", zip: "95816" }),
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
      "canopy-commons",
      "Canopy Commons",
      "94-2698044",
      "info@canopycommons.org",
      null,
      "Canopy Commons helps residents plant and care for street trees and sidewalk gardens, and keeps a public inventory of the urban canopy. (Shown here for illustration.)",
      addr({ line1: "1007 Riverside Drive", line2: "#1", city: "Sacramento", state: "CA", zip: "95818" }),
      "Daniel Okafor",
      "Volunteer Coordinator",
      "active",
      0,
      now - 120 * DAY
    )
  );
  stmts.push(
    orgIns.bind(
      ORG_FOOD,
      "colift-food-access",
      "colift Food Access",
      "87-9999001",
      "food@colift.org",
      null,
      "colift Food Access publishes an open, volunteer-collected dataset of shelf-tag grocery prices across the country. The data is free, public (CC0), and used by food banks, researchers, and county health departments to track food affordability where SNAP recipients actually shop.",
      addr({ line1: "1 Capitol Mall", city: "Sacramento", state: "CA", zip: "95814" }),
      "Alex Mercado",
      "Program Director",
      "active",
      1,
      now - 60 * DAY
    )
  );
  stmts.push(
    orgIns.bind(
      ORG_GOV,
      "colift-digital-access",
      "colift Digital Access",
      "87-9999002",
      "digital@colift.org",
      null,
      "colift Digital Access publishes an open, volunteer-collected dataset of usability and accessibility audits of government websites. The data is free, public (CC0), and shared back with the public offices that run these pages so residents can actually complete the tasks that benefits depend on.",
      addr({ line1: "1 Capitol Mall", city: "Sacramento", state: "CA", zip: "95814" }),
      "Alex Mercado",
      "Program Director",
      "active",
      1,
      now - 45 * DAY
    )
  );
  stmts.push(
    orgIns.bind(
      ORG_CITIZEN_SCIENCE,
      "colift-citizen-science",
      "colift Citizen Science",
      "87-9999003",
      "science@colift.org",
      null,
      "colift Citizen Science verifies hours volunteers contribute to public-interest research projects on third-party platforms like Zooniverse. We do not run the science — we read the certificate the platform generates and confirm the work happened.",
      addr({ line1: "1 Capitol Mall", city: "Sacramento", state: "CA", zip: "95814" }),
      "Alex Mercado",
      "Program Director",
      "active",
      1,
      now - 30 * DAY
    )
  );

  // ---- external directory orgs ----
  const extOrgs: [string, string, string, string, string, string, string, string, string, string][] = [
    [ORG_HABITAT, "habitat-for-humanity", "Habitat for Humanity", "91-1914001", "volunteer@habitat.org",
      "/orgs/habitat-for-humanity.svg",
      "Habitat for Humanity brings people together to build homes, communities, and hope. Volunteers and partner families work side by side to build and repair homes for families who need a safe, affordable place to live.",
      addr({ line1: "285 Peachtree Center Ave NE", city: "Atlanta", state: "GA", zip: "30303" }), "Jonathan Reckford", "CEO"],
    [ORG_REDCROSS, "american-red-cross", "American Red Cross", "53-0196001", "volunteer@redcross.org",
      "/orgs/american-red-cross.svg",
      "The American Red Cross prevents and alleviates human suffering in the face of emergencies by mobilizing the power of volunteers and the generosity of donors. We respond to nearly 70,000 disasters a year across the United States.",
      addr({ line1: "430 17th St NW", city: "Washington", state: "DC", zip: "20006" }), "Gail McGovern", "President & CEO"],
    [ORG_FEEDING, "feeding-america", "Feeding America", "36-3673001", "volunteer@feedingamerica.org",
      "/orgs/feeding-america.svg",
      "Feeding America is the largest hunger-relief organization in the United States. Through a network of 200 food banks and 60,000 food pantries and meal programs, we help provide food to more than 49 million people facing hunger.",
      addr({ line1: "161 N. Clark St", city: "Chicago", state: "IL", zip: "60601" }), "Claire Babineaux-Fontenot", "CEO"],
    [ORG_MOW, "meals-on-wheels-america", "Meals on Wheels America", "52-1325001", "volunteer@mealsonwheelsamerica.org",
      "/orgs/meals-on-wheels-america.svg",
      "Meals on Wheels America supports 5,000 local senior nutrition programs across the country with funding, education, research, and advocacy. More than two million volunteers deliver meals and check in on homebound older adults every day.",
      addr({ line1: "1550 Crystal Dr", city: "Arlington", state: "VA", zip: "22202" }), "Ellie Hollander", "President & CEO"],
    [ORG_SIERRA, "sierra-club-foundation", "Sierra Club Foundation", "94-1153001", "volunteer@sierraclub.org",
      "/orgs/sierra-club-foundation.png",
      "The Sierra Club Foundation advances the conservation of the natural environment by empowering people to protect the places they love. We organize trail restoration outings, watershed monitoring programs, and citizen science projects nationwide.",
      addr({ line1: "2101 Webster St", city: "Oakland", state: "CA", zip: "94612" }), "Michael Brune", "Executive Director"],
    [ORG_AUDUBON, "national-audubon-society", "National Audubon Society", "13-1624001", "volunteer@audubon.org",
      "/orgs/national-audubon-society.svg",
      "Audubon protects birds and the places they need, today and tomorrow, through science, advocacy, education, and on-the-ground conservation. Community science volunteers contribute millions of bird observations every year through programs like the Christmas Bird Count.",
      addr({ line1: "225 Varick St", city: "New York", state: "NY", zip: "10014" }), "Elizabeth Gray", "CEO"],
    [ORG_BBBS, "big-brothers-big-sisters", "Big Brothers Big Sisters of America", "13-5661001", "volunteer@bbbs.org",
      "/orgs/big-brothers-big-sisters.png",
      "Big Brothers Big Sisters operates in over 230 communities across all 50 states. Volunteer mentors — Bigs — spend time with children and teenagers who need a consistent, caring adult in their corner.",
      addr({ line1: "2502 N. Rocky Point Dr", city: "Tampa", state: "FL", zip: "33607" }), "Artis Stevens", "President & CEO"],
    [ORG_PROLITERACY, "proliteracy", "ProLiteracy", "16-0760001", "volunteer@proliteracy.org",
      "/orgs/proliteracy.svg",
      "ProLiteracy is the largest adult literacy organization in the world, with more than 1,000 member programs across the United States. We train volunteers to teach reading, writing, math, and English as a second language to adults.",
      addr({ line1: "101 Wyoming St", city: "Syracuse", state: "NY", zip: "13204" }), "Kevin Morgan", "President & CEO"],
    [ORG_HUMANE, "humane-society", "The Humane Society of the United States", "53-0225001", "volunteer@humanesociety.org",
      "/orgs/humane-society.svg",
      "The Humane Society of the United States is the nation's most effective animal protection organization. We work to reduce animal suffering through rescue, advocacy, and volunteer programs at local shelters and rescues across the country.",
      addr({ line1: "1255 23rd St NW", city: "Washington", state: "DC", zip: "20037" }), "Kitty Block", "President & CEO"],
    [ORG_TWB, "translators-without-borders", "Translators Without Borders", "45-3861001", "volunteer@translatorswithoutborders.org",
      "/orgs/translators-without-borders.png",
      "Translators Without Borders increases access to vital knowledge by providing language services to humanitarian and development organizations. Our community of 80,000 volunteer translators works in more than 190 language pairs.",
      addr({ line1: "1101 14th St NW", city: "Washington", state: "DC", zip: "20005" }), "Aimee Ansari", "Executive Director"],
  ];

  for (const [id, slug, name, ein, email, logoUrl, about, address, authName, authTitle] of extOrgs) {
    stmts.push(
      orgIns.bind(id, slug, name, ein, email, logoUrl, about, address, authName, authTitle, "active", 1, now - 60 * DAY)
    );
  }

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
      "Sacramento",
      "CA",
      "snap_cert",
      "Marisol Reyes Castellanos",
      "0712345",
      addr({ line1: "1242 Elm Street", line2: "Apt 3", city: "Sacramento", state: "CA", zip: "95814" }),
      "1991-03-14",
      "(916) 555-0142",
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
      "Sacramento",
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
      "Sacramento", "CA", "snap_cert", "André Beaumont", "0719902",
      addr({ line1: "655 Maple Avenue", city: "Sacramento", state: "CA", zip: "95816" }),
      "1988-07-22", "(916) 555-0188", now - 20 * DAY, null, now - 20 * DAY, null, now - 25 * DAY
    )
  );
  stmts.push(
    userIns.bind(
      USER_LINH, "linh.tran@example.com", "recipient", null, "Linh Tran",
      "Sacramento", "CA", "snap_cert", "Linh Tran", "0723318",
      addr({ line1: "1530 Cedar Street", city: "Sacramento", state: "CA", zip: "95818" }),
      "1995-11-02", "(916) 555-0173", now - 15 * DAY, null, now - 15 * DAY, null, now - 18 * DAY
    )
  );
  stmts.push(
    userIns.bind(USER_PRIYA, "priya.venkatesan@example.com", "org_member", "org_admin", "Priya Venkatesan",
      "Sacramento", "CA", "n/a", null, null, null, null, null, null, null, null, ORG_SFCDC, now - 110 * DAY)
  );
  stmts.push(
    userIns.bind(USER_DANIEL, "daniel.okafor@example.com", "org_member", "reviewer", "Daniel Okafor",
      "Sacramento", "CA", "n/a", null, null, null, null, null, null, null, null, ORG_FUF, now - 100 * DAY)
  );
  stmts.push(
    userIns.bind(USER_HANA, "hana.ishikawa@example.com", "org_member", "reviewer", "Hana Ishikawa",
      "Sacramento", "CA", "n/a", null, null, null, null, null, null, null, null, ORG_CITIZEN_SCIENCE, now - 30 * DAY)
  );
  stmts.push(
    userIns.bind(USER_ADMIN, "alex.mercado@example.com", "admin", null, "Alex Mercado",
      "Sacramento", "CA", "n/a", null, null, null, null, null, null, null, null, null, now - 130 * DAY)
  );

  // ---- org invitations (H1) ----
  // The /start org-pick flow no longer trusts client-supplied org_role/org_id;
  // an org join is only valid against a pending org_invites row addressed to the
  // user's email (mirrors app/auth-actions.ts). The sample org accounts already
  // have their roles seeded directly, but without a matching invite they would
  // be locked out if they ever re-traverse org-pick. Seed an unaccepted invite
  // for each seeded org member so that path keeps working. `invited_by` is the
  // platform admin; org_role mirrors each member's seeded role.
  const inviteIns = db.prepare(
    "INSERT INTO org_invites (id, org_id, email, org_role, invited_by, created_at, accepted_at) VALUES (?,?,?,?,?,?,?)"
  );
  const seedInvites: { id: string; orgId: string; email: string; orgRole: "reviewer" | "org_admin" }[] = [
    { id: "invite_priya", orgId: ORG_SFCDC, email: "priya.venkatesan@example.com", orgRole: "org_admin" },
    { id: "invite_daniel", orgId: ORG_FUF, email: "daniel.okafor@example.com", orgRole: "reviewer" },
    { id: "invite_hana", orgId: ORG_CITIZEN_SCIENCE, email: "hana.ishikawa@example.com", orgRole: "reviewer" },
  ];
  for (const inv of seedInvites) {
    stmts.push(inviteIns.bind(inv.id, inv.orgId, inv.email, inv.orgRole, USER_ADMIN, now - 115 * DAY, null));
  }

  // ---- task templates ----
  const taskIns = db.prepare(
    `INSERT INTO task_templates (id, org_id, created_by_user_id, title, category, short_description,
      instructions_md, checklist_json, deliverable_spec_json, validation_rubric_md,
      est_hours, max_hours, location_kind, status, created_at, closes_at, listing_type, external_url)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  );
  for (const t of TASKS) {
    const createdBy = t.org_id === ORG_SFCDC ? USER_PRIYA : USER_DANIEL;
    // Only the food-audit task is live in the catalog. Older seeded tasks stay
    // archived so their sample submissions / hours rows still reference a valid
    // task_template row but they don't surface in /app/tasks.
    const status =
      t.id === TASK_FOOD_AUDIT || t.id === TASK_GOV_AUDIT || t.id === TASK_EMS_RATES
        ? "active"
        : "archived";
    const createdAt = t.createdAtOffset != null ? now - t.createdAtOffset : now - 90 * DAY;
    const closesAt = t.closesAtOffset !== undefined ? t.closesAtOffset : null;
    stmts.push(
      taskIns.bind(
        t.id, t.org_id, createdBy, t.title, t.category, t.short_description,
        t.instructions_md, JSON.stringify(t.checklist), JSON.stringify(t.spec), t.rubric,
        t.est, t.max, t.location, status, createdAt, closesAt, "native", null
      )
    );
  }

  // ---- external directory listings ----
  const EXT_SPEC = JSON.stringify({ kind: "community-service" });
  const EXT_RUBRIC = "External opportunity — no colift validation required.";
  for (const t of EXTERNAL_TASKS) {
    const createdAt = now - t.createdAtOffset;
    stmts.push(
      taskIns.bind(
        t.id, t.org_id, USER_ADMIN, t.title, t.category, t.short_description,
        t.instructions_md, "[]",
        t.category === "translation" ? JSON.stringify({ kind: "translation" }) : EXT_SPEC,
        EXT_RUBRIC,
        t.est, t.max, t.location, "active", createdAt, null, "external", t.external_url
      )
    );
  }

  // ---- Zooniverse umbrella task (external_certificate evidence mode) ----
  // One task that covers any Zooniverse project. The volunteer picks the
  // specific project on Zooniverse, classifies on their own account, and
  // returns with a certificate. No per-project allowlist — every Zooniverse
  // project passes the 4-part gate by construction (public-interest research
  // curated by Adler Planetarium with a free public dataset).
  const zoonInstructions =
    "## What you'll do\nZooniverse hosts dozens of real research projects across biology, climate, astronomy, history, and medicine. Every project produces a public dataset researchers actually use. You pick whichever one looks interesting, classify on your own account, and your hours count toward your colift record.\n\n1. **Open Zooniverse** and either sign in or create a free account.\n2. **Pick a project** — anything that catches your eye. Whales, galaxies, weather diaries, rainforest sounds, whatever.\n3. **Classify**. Do as much or as little as you want in one session.\n4. When you're ready to log hours (typically end-of-month), **generate your Volunteer Certificate** from your Zooniverse profile.\n5. Come back to colift, upload the certificate, tell us which project you worked on, and a reviewer will credit the hours within a few days.\n\n## Why this counts\nEvery Zooniverse project is real public-interest research with a free public output — exactly the kind of work colift is built to recognize. We don't need to pre-approve which project you pick.\n\n## Hours credit\nWe credit the hours your Zooniverse certificate shows. No artificial cap.";
  const zoonRubric =
    "A complete submission has a legible Zooniverse Volunteer Certificate that names the volunteer, lists the reporting period, and shows the project + hours. Any Zooniverse project qualifies as long as the certificate is authentic and matches the submitting volunteer.";
  const zoonCheck: ChecklistItem[] = [
    { id: "account", label: "Sign in to Zooniverse with your own account", required: true },
    { id: "classify", label: "Complete at least one classification session", required: true },
    { id: "certificate", label: "Generate a Volunteer Certificate for the month", required: true },
    { id: "describe", label: "Tell us which project you worked on and what you did", required: true },
  ];
  stmts.push(
    taskIns.bind(
      TASK_ZOONIVERSE, ORG_CITIZEN_SCIENCE, USER_ADMIN,
      "Volunteer on Zooniverse",
      "citizen-science",
      "Pick any project on Zooniverse — wildlife photos, historical documents, deep-space images, weather records — classify what you can, then upload your monthly Zooniverse Volunteer Certificate. colift verifies the certificate and credits the hours.",
      zoonInstructions, JSON.stringify(zoonCheck),
      JSON.stringify({ kind: "citizen-science" }),
      zoonRubric,
      1, 999, "online", "active", now - 14 * DAY, null, "native", null
    )
  );

  // External provider columns aren't in the base INSERT — set them after.
  // monthly_minutes_cap = NULL means no artificial cap; we credit what the cert says.
  stmts.push(
    db.prepare(
      "UPDATE task_templates SET external_provider = ?, evidence_mode = ?, monthly_minutes_cap = NULL WHERE id = ?"
    ).bind("zooniverse", "external_certificate", TASK_ZOONIVERSE)
  );

  // ---- submissions ----
  const subIns = db.prepare(
    `INSERT INTO submissions (id, user_id, task_template_id, status, committed_at, first_started_at,
      submitted_at, reviewed_at, time_log_json, checklist_progress_json, user_notes,
      ai_verdict_json, reviewer_id, reviewer_notes, hours_credited)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  );

  const verdictApprove = JSON.stringify({
    verdict: "approve", confidence: 0.91,
    reasoning: "Photos show distinct street trees on a city block with daylight and sidewalk context. Condition notes are specific. Looks like genuine first-hand fieldwork.",
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
    "Got 6 of 10 so far — finishing the stretch along the main commercial strip this weekend.", null, null, null, null
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
    "Profile of Riverside Park downtown — heavily used by families after school.",
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
    "Counted 14 trees on the 600 block of Maple Avenue — mostly London plane, two ginkgos.",
    verdictApprove, null, null, null
  ));
  stmts.push(subIns.bind(
    "sub_l_pending", USER_LINH, TASK_TREES, "pending_review", now - 1 * DAY, now - 1 * DAY,
    now - 8 * HOUR, null,
    JSON.stringify([{ start: now - 1 * DAY, end: now - 1 * DAY + 2 * HOUR }]),
    JSON.stringify({ walk: true, species: true, condition: true, photos: true, gaps: false }),
    "A downtown block — lots of street trees lifting the sidewalk.",
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
        photoMeta(38.5816 + i * 0.001, -121.4944 - i * 0.001, `seedhash_${sid}_${i}`)
      ));
    }
  }

  // ---- hours ledger (Marisol: certified 8 this month via Civic Data Collective) ----
  const ledgerIns = db.prepare(
    `INSERT INTO hours_ledger (id, user_id, month, total_hours, certified_org_id) VALUES (?,?,?,?,?)`
  );
  stmts.push(ledgerIns.bind("ledger_m_sfcdc", USER_MARISOL, month, 8, ORG_SFCDC));

  // ---- counties (per-county pre-clearance): Sacramento cleared (sample) ----
  const countyIns = db.prepare(
    `INSERT INTO counties (id, name, state, cert_enabled, cleared_at, clearance_note) VALUES (?,?,?,?,?,?)`
  );
  stmts.push(countyIns.bind("county_sacramento", "Sacramento", "CA", 1, now - 30 * DAY, "Written CDSS/county confirmation on file."));
  stmts.push(countyIns.bind("county_losangeles", "Los Angeles", "CA", 0, null, null));
  stmts.push(countyIns.bind("county_fresno", "Fresno", "CA", 0, null, null));

  // ---- basket templates (Food Access Price Audit) ----
  const { USDA_THRIFTY_6 } = await import("./food-audit");
  stmts.push(
    db.prepare(
      `INSERT INTO basket_templates (id, version, display_name, items_json, created_at) VALUES (?,?,?,?,?)`
    ).bind(
      USDA_THRIFTY_6.id, USDA_THRIFTY_6.version, USDA_THRIFTY_6.display_name,
      JSON.stringify(USDA_THRIFTY_6.items), now - 60 * DAY
    )
  );

  // ---- a few seed stores so volunteers see suggestions even with no POI provider ----
  const storeIns = db.prepare(
    `INSERT INTO stores (id, name, address, geocode_lat, geocode_lng, google_place_id, created_by_user_id, created_at) VALUES (?,?,?,?,?,?,?,?)`
  );
  stmts.push(storeIns.bind("store_safeway_market", "Safeway", "2020 Capitol Avenue, Sacramento, CA 95816", 38.5723, -121.4710, null, null, now - 60 * DAY));
  stmts.push(storeIns.bind("store_sunrise_natural", "Sunrise Natural Foods", "1745 J Street, Sacramento, CA 95811", 38.5760, -121.4860, null, null, now - 60 * DAY));
  stmts.push(storeIns.bind("store_99ranch", "99 Ranch Market", "3288 Stockton Blvd, Sacramento, CA 95820", 38.5380, -121.4640, null, null, now - 60 * DAY));
  stmts.push(storeIns.bind("store_target_downtown", "Target", "789 K Street, Sacramento, CA 95814", 38.5790, -121.4920, null, null, now - 60 * DAY));

  // ---- flags: the tree-census pending submissions are clean ("No flags raised") ----
  // (No flag rows inserted for seed; the review screen shows "No flags raised".)

  await db.batch(stmts);

  // Give every seeded account a real (hashed) password + verified email so the
  // sample accounts are loginnable with SEED_PASSWORD. Production accounts set their own.
  const seedHash = await hashPassword(SEED_PASSWORD);
  await db
    .prepare("UPDATE users SET password_hash = ?, email_verified_at = ? WHERE password_hash IS NULL")
    .bind(seedHash, now)
    .run();

  // Backfill measured active engagement from seeded wall-clock sessions (treat
  // seeded sessions as fully active) so credit/pending math is consistent.
  const backfill = (await db.prepare("SELECT id, time_log_json FROM submissions").all<{ id: string; time_log_json: string }>()).results ?? [];
  for (const s of backfill) {
    const secs = Math.round(totalLoggedHours(parseJson<TimeLogSession[]>(s.time_log_json, [])) * 3600);
    if (secs > 0) {
      await db.prepare("UPDATE submissions SET measured_active_seconds = ? WHERE id = ?").bind(secs, s.id).run();
    }
  }
  // Approved seed work is published as a free public deliverable.
  await db.prepare("UPDATE submissions SET published_at = reviewed_at WHERE status = 'approved' AND published_at IS NULL").run();

  // Seeded active tasks genuinely pass the 4-part gate — mark them reviewed so the
  // legal-invariant monitor (no active task without gate review) is clean.
  await db
    .prepare(
      "UPDATE task_templates SET gate_external_beneficiary = 1, gate_genuine_need = 1, gate_free_deliverable = 1, gate_would_do_anyway = 1, gate_reviewed_by = ?, gate_reviewed_at = ? WHERE status = 'active'"
    )
    .bind(USER_ADMIN, now)
    .run();
}

/** Seed only if the database is empty (first-run bootstrap). */
export async function ensureSeeded(db: D1Database, now: number = Date.now()): Promise<void> {
  const row = await db.prepare("SELECT COUNT(*) AS n FROM users").first<{ n: number }>();
  if (!row || row.n === 0) {
    await seedDatabase(db, now);
  }
}
