/**
 * Government + civic-service site registry — the auditable surface.
 *
 * Curated seed set covering federal portals, every US state portal, a sample of
 * California city sites (the pilot launch market), and a handful of large
 * nonprofits that operate as public-service intake. Audits work best when there
 * are MANY independent raters of high-impact pages — picking from a fixed,
 * relevant pool gives that comparability and avoids "everyone audits whatever
 * homepage they happen to think of."
 *
 * Expand freely: each entry is a plain literal. The picker functions are
 * deterministic given a seed (used so server-rendered + client-hydrated picks
 * agree without flicker).
 */

export type GovSiteKind = "federal" | "state" | "local" | "tribal" | "nonprofit";

export interface GovSite {
  id: string;
  name: string;
  url: string;
  kind: GovSiteKind;
  /** Two-letter US state code (lowercase) when the site is state- or city-scoped. */
  state?: string;
  /** Lowercase city name when the site is municipal. */
  city?: string;
  /** Short, plain-English description of why this site matters to residents. */
  description: string;
}

// ---------- Federal ----------

const FEDERAL: GovSite[] = [
  { id: "fed-usa", name: "USA.gov", url: "https://www.usa.gov", kind: "federal", description: "Top-level portal connecting residents to federal benefits and services." },
  { id: "fed-benefits", name: "Benefits.gov", url: "https://www.benefits.gov", kind: "federal", description: "Benefit finder spanning SNAP, Medicare, housing, disability, and more." },
  { id: "fed-snap", name: "USDA SNAP", url: "https://www.fns.usda.gov/snap", kind: "federal", description: "Federal home for the Supplemental Nutrition Assistance Program (SNAP)." },
  { id: "fed-ssa", name: "Social Security Administration", url: "https://www.ssa.gov", kind: "federal", description: "Apply for retirement, disability, Medicare; manage your record." },
  { id: "fed-medicare", name: "Medicare.gov", url: "https://www.medicare.gov", kind: "federal", description: "Federal health insurance for people 65+ and certain disabilities." },
  { id: "fed-medicaid", name: "Medicaid.gov", url: "https://www.medicaid.gov", kind: "federal", description: "Federal-state health coverage for low-income residents." },
  { id: "fed-hud", name: "HUD", url: "https://www.hud.gov", kind: "federal", description: "Housing assistance, fair-housing, and homeless-services info." },
  { id: "fed-irs", name: "IRS", url: "https://www.irs.gov", kind: "federal", description: "Federal taxes, filing help, refund status." },
  { id: "fed-va", name: "VA.gov", url: "https://www.va.gov", kind: "federal", description: "Veterans health care, benefits, claims." },
  { id: "fed-dol", name: "Department of Labor", url: "https://www.dol.gov", kind: "federal", description: "Workers' rights, wage theft, unemployment guidance." },
  { id: "fed-ed", name: "Federal Student Aid", url: "https://studentaid.gov", kind: "federal", description: "FAFSA, federal student loans, repayment plans." },
  { id: "fed-uscis", name: "USCIS", url: "https://www.uscis.gov", kind: "federal", description: "Immigration applications, status checks, work authorization." },
  { id: "fed-childcare", name: "Childcare.gov", url: "https://childcare.gov", kind: "federal", description: "Find licensed childcare, financial assistance, parent resources." },
];

// ---------- State portals (all 50 + DC + PR) ----------
// Source: each state's official top-level .gov portal as of 2026. Picker uses
// these as the default state landing page when no city match exists.

const STATE: GovSite[] = [
  { id: "st-al", state: "al", name: "Alabama.gov", url: "https://www.alabama.gov", kind: "state", description: "Alabama state services and agencies." },
  { id: "st-ak", state: "ak", name: "Alaska.gov", url: "https://alaska.gov", kind: "state", description: "Alaska state services and agencies." },
  { id: "st-az", state: "az", name: "AZ.gov", url: "https://az.gov", kind: "state", description: "Arizona state services and agencies." },
  { id: "st-ar", state: "ar", name: "Arkansas.gov", url: "https://portal.arkansas.gov", kind: "state", description: "Arkansas state services and agencies." },
  { id: "st-ca", state: "ca", name: "CA.gov", url: "https://www.ca.gov", kind: "state", description: "California state services and agencies." },
  { id: "st-ca-benefits", state: "ca", name: "BenefitsCal", url: "https://benefitscal.com", kind: "state", description: "California's portal for CalFresh, Medi-Cal, CalWORKs applications." },
  { id: "st-co", state: "co", name: "Colorado.gov", url: "https://www.colorado.gov", kind: "state", description: "Colorado state services and agencies." },
  { id: "st-ct", state: "ct", name: "CT.gov", url: "https://portal.ct.gov", kind: "state", description: "Connecticut state services and agencies." },
  { id: "st-de", state: "de", name: "Delaware.gov", url: "https://delaware.gov", kind: "state", description: "Delaware state services and agencies." },
  { id: "st-dc", state: "dc", name: "DC.gov", url: "https://dc.gov", kind: "local", city: "washington", description: "District of Columbia government services." },
  { id: "st-fl", state: "fl", name: "MyFlorida", url: "https://www.myflorida.com", kind: "state", description: "Florida state services and agencies." },
  { id: "st-ga", state: "ga", name: "Georgia.gov", url: "https://georgia.gov", kind: "state", description: "Georgia state services and agencies." },
  { id: "st-hi", state: "hi", name: "Hawaii.gov", url: "https://portal.ehawaii.gov", kind: "state", description: "Hawaii state services and agencies." },
  { id: "st-id", state: "id", name: "Idaho.gov", url: "https://www.idaho.gov", kind: "state", description: "Idaho state services and agencies." },
  { id: "st-il", state: "il", name: "Illinois.gov", url: "https://www.illinois.gov", kind: "state", description: "Illinois state services and agencies." },
  { id: "st-in", state: "in", name: "IN.gov", url: "https://www.in.gov", kind: "state", description: "Indiana state services and agencies." },
  { id: "st-ia", state: "ia", name: "Iowa.gov", url: "https://www.iowa.gov", kind: "state", description: "Iowa state services and agencies." },
  { id: "st-ks", state: "ks", name: "Kansas.gov", url: "https://www.kansas.gov", kind: "state", description: "Kansas state services and agencies." },
  { id: "st-ky", state: "ky", name: "Kentucky.gov", url: "https://kentucky.gov", kind: "state", description: "Kentucky state services and agencies." },
  { id: "st-la", state: "la", name: "Louisiana.gov", url: "https://www.louisiana.gov", kind: "state", description: "Louisiana state services and agencies." },
  { id: "st-me", state: "me", name: "Maine.gov", url: "https://www.maine.gov", kind: "state", description: "Maine state services and agencies." },
  { id: "st-md", state: "md", name: "Maryland.gov", url: "https://www.maryland.gov", kind: "state", description: "Maryland state services and agencies." },
  { id: "st-ma", state: "ma", name: "Mass.gov", url: "https://www.mass.gov", kind: "state", description: "Massachusetts state services and agencies." },
  { id: "st-mi", state: "mi", name: "Michigan.gov", url: "https://www.michigan.gov", kind: "state", description: "Michigan state services and agencies." },
  { id: "st-mn", state: "mn", name: "MN.gov", url: "https://mn.gov", kind: "state", description: "Minnesota state services and agencies." },
  { id: "st-ms", state: "ms", name: "MS.gov", url: "https://www.ms.gov", kind: "state", description: "Mississippi state services and agencies." },
  { id: "st-mo", state: "mo", name: "MO.gov", url: "https://mo.gov", kind: "state", description: "Missouri state services and agencies." },
  { id: "st-mt", state: "mt", name: "MT.gov", url: "https://mt.gov", kind: "state", description: "Montana state services and agencies." },
  { id: "st-ne", state: "ne", name: "Nebraska.gov", url: "https://www.nebraska.gov", kind: "state", description: "Nebraska state services and agencies." },
  { id: "st-nv", state: "nv", name: "NV.gov", url: "https://nv.gov", kind: "state", description: "Nevada state services and agencies." },
  { id: "st-nh", state: "nh", name: "NH.gov", url: "https://www.nh.gov", kind: "state", description: "New Hampshire state services and agencies." },
  { id: "st-nj", state: "nj", name: "NJ.gov", url: "https://www.nj.gov", kind: "state", description: "New Jersey state services and agencies." },
  { id: "st-nm", state: "nm", name: "NewMexico.gov", url: "https://www.newmexico.gov", kind: "state", description: "New Mexico state services and agencies." },
  { id: "st-ny", state: "ny", name: "NY.gov", url: "https://www.ny.gov", kind: "state", description: "New York state services and agencies." },
  { id: "st-nc", state: "nc", name: "NC.gov", url: "https://www.nc.gov", kind: "state", description: "North Carolina state services and agencies." },
  { id: "st-nd", state: "nd", name: "ND.gov", url: "https://www.nd.gov", kind: "state", description: "North Dakota state services and agencies." },
  { id: "st-oh", state: "oh", name: "Ohio.gov", url: "https://ohio.gov", kind: "state", description: "Ohio state services and agencies." },
  { id: "st-ok", state: "ok", name: "Oklahoma.gov", url: "https://oklahoma.gov", kind: "state", description: "Oklahoma state services and agencies." },
  { id: "st-or", state: "or", name: "Oregon.gov", url: "https://www.oregon.gov", kind: "state", description: "Oregon state services and agencies." },
  { id: "st-pa", state: "pa", name: "PA.gov", url: "https://www.pa.gov", kind: "state", description: "Pennsylvania state services and agencies." },
  { id: "st-ri", state: "ri", name: "RI.gov", url: "https://www.ri.gov", kind: "state", description: "Rhode Island state services and agencies." },
  { id: "st-sc", state: "sc", name: "SC.gov", url: "https://sc.gov", kind: "state", description: "South Carolina state services and agencies." },
  { id: "st-sd", state: "sd", name: "SD.gov", url: "https://sd.gov", kind: "state", description: "South Dakota state services and agencies." },
  { id: "st-tn", state: "tn", name: "TN.gov", url: "https://www.tn.gov", kind: "state", description: "Tennessee state services and agencies." },
  { id: "st-tx", state: "tx", name: "Texas.gov", url: "https://www.texas.gov", kind: "state", description: "Texas state services and agencies." },
  { id: "st-ut", state: "ut", name: "Utah.gov", url: "https://utah.gov", kind: "state", description: "Utah state services and agencies." },
  { id: "st-vt", state: "vt", name: "Vermont.gov", url: "https://www.vermont.gov", kind: "state", description: "Vermont state services and agencies." },
  { id: "st-va", state: "va", name: "Virginia.gov", url: "https://www.virginia.gov", kind: "state", description: "Virginia state services and agencies." },
  { id: "st-wa", state: "wa", name: "Access Washington", url: "https://access.wa.gov", kind: "state", description: "Washington state services and agencies." },
  { id: "st-wv", state: "wv", name: "WV.gov", url: "https://www.wv.gov", kind: "state", description: "West Virginia state services and agencies." },
  { id: "st-wi", state: "wi", name: "WI.gov", url: "https://www.wisconsin.gov", kind: "state", description: "Wisconsin state services and agencies." },
  { id: "st-wy", state: "wy", name: "Wyoming.gov", url: "https://www.wyoming.gov", kind: "state", description: "Wyoming state services and agencies." },
];

// ---------- Local (California-first; expand as Tended expands) ----------

const LOCAL: GovSite[] = [
  { id: "loc-sacramento", state: "ca", city: "sacramento", name: "City of Sacramento", url: "https://www.cityofsacramento.gov", kind: "local", description: "Sacramento city services, permits, utilities." },
  { id: "loc-sf", state: "ca", city: "san francisco", name: "SF.gov", url: "https://www.sf.gov", kind: "local", description: "San Francisco city services and benefits." },
  { id: "loc-la", state: "ca", city: "los angeles", name: "LACity.gov", url: "https://www.lacity.gov", kind: "local", description: "Los Angeles city services." },
  { id: "loc-sd", state: "ca", city: "san diego", name: "City of San Diego", url: "https://www.sandiego.gov", kind: "local", description: "San Diego city services." },
  { id: "loc-oakland", state: "ca", city: "oakland", name: "OaklandCA.gov", url: "https://www.oaklandca.gov", kind: "local", description: "Oakland city services." },
  { id: "loc-fresno", state: "ca", city: "fresno", name: "City of Fresno", url: "https://www.fresno.gov", kind: "local", description: "Fresno city services." },
  { id: "loc-sj", state: "ca", city: "san jose", name: "SanJoseCA.gov", url: "https://www.sanjoseca.gov", kind: "local", description: "San Jose city services." },
  { id: "loc-lb", state: "ca", city: "long beach", name: "Long Beach", url: "https://www.longbeach.gov", kind: "local", description: "Long Beach city services." },
  { id: "loc-bakersfield", state: "ca", city: "bakersfield", name: "BakersfieldCity.us", url: "https://www.bakersfieldcity.us", kind: "local", description: "Bakersfield city services." },
  { id: "loc-anaheim", state: "ca", city: "anaheim", name: "Anaheim.net", url: "https://www.anaheim.net", kind: "local", description: "Anaheim city services." },
  { id: "loc-nyc", state: "ny", city: "new york", name: "NYC.gov", url: "https://www.nyc.gov", kind: "local", description: "New York City services." },
  { id: "loc-chicago", state: "il", city: "chicago", name: "ChiCity", url: "https://www.chicago.gov", kind: "local", description: "Chicago city services." },
  { id: "loc-seattle", state: "wa", city: "seattle", name: "Seattle.gov", url: "https://www.seattle.gov", kind: "local", description: "Seattle city services." },
  { id: "loc-boston", state: "ma", city: "boston", name: "Boston.gov", url: "https://www.boston.gov", kind: "local", description: "Boston city services." },
  { id: "loc-philly", state: "pa", city: "philadelphia", name: "Phila.gov", url: "https://www.phila.gov", kind: "local", description: "Philadelphia city services." },
  { id: "loc-portland", state: "or", city: "portland", name: "Portland.gov", url: "https://www.portland.gov", kind: "local", description: "Portland city services." },
  { id: "loc-houston", state: "tx", city: "houston", name: "HoustonTX.gov", url: "https://www.houstontx.gov", kind: "local", description: "Houston city services." },
  { id: "loc-austin", state: "tx", city: "austin", name: "AustinTexas.gov", url: "https://www.austintexas.gov", kind: "local", description: "Austin city services." },
  { id: "loc-denver", state: "co", city: "denver", name: "DenverGov.org", url: "https://www.denvergov.org", kind: "local", description: "Denver city services." },
  { id: "loc-phoenix", state: "az", city: "phoenix", name: "Phoenix.gov", url: "https://www.phoenix.gov", kind: "local", description: "Phoenix city services, permits, and benefits." },
  { id: "loc-sanantonio", state: "tx", city: "san antonio", name: "SanAntonio.gov", url: "https://www.sanantonio.gov", kind: "local", description: "San Antonio city services." },
  { id: "loc-dallas", state: "tx", city: "dallas", name: "DallasTexas.gov", url: "https://www.dallastexas.gov", kind: "local", description: "Dallas city services." },
  { id: "loc-jacksonville", state: "fl", city: "jacksonville", name: "JaxReady.com / COJ.net", url: "https://www.coj.net", kind: "local", description: "Jacksonville-Duval consolidated city-county services." },
  { id: "loc-columbus", state: "oh", city: "columbus", name: "Columbus.gov", url: "https://www.columbus.gov", kind: "local", description: "Columbus city services." },
];

// ---------- Nonprofits acting as public-service intake ----------

const NONPROFIT: GovSite[] = [
  { id: "np-211", name: "211.org", url: "https://www.211.org", kind: "nonprofit", description: "Free national line connecting people to local health and social services." },
  { id: "np-feedingamerica", name: "Feeding America", url: "https://www.feedingamerica.org", kind: "nonprofit", description: "Find a food bank near you anywhere in the US." },
  { id: "np-unitedway", name: "United Way", url: "https://www.unitedway.org", kind: "nonprofit", description: "Local-help finder across thousands of US chapters." },
  { id: "np-legalaid", name: "Legal Services Corporation", url: "https://www.lsc.gov", kind: "nonprofit", description: "Find free civil legal aid in your area." },
  { id: "np-volunteer", name: "VolunteerMatch", url: "https://www.volunteermatch.org", kind: "nonprofit", description: "National volunteer-opportunities marketplace." },
];

/** The full registry — federal first, then state, local, nonprofit. */
export const GOV_SITES: GovSite[] = [...FEDERAL, ...STATE, ...LOCAL, ...NONPROFIT];

// ---------- Pickers ----------

function normCity(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function normState(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase().slice(0, 2);
}

/**
 * Sites that match a viewer's city and/or state, ordered most-specific first
 * (city match → state local sites → state portal → federal pool). Always
 * returns at least the federal portals so the chooser never shows an empty list.
 */
export function sitesForViewer(city: string | null | undefined, state: string | null | undefined): GovSite[] {
  const c = normCity(city);
  const s = normState(state);
  const cityHits = c ? GOV_SITES.filter((g) => g.city === c) : [];
  const stateLocal = s ? GOV_SITES.filter((g) => g.kind === "local" && g.state === s && g.city !== c) : [];
  const statePortal = s ? GOV_SITES.filter((g) => g.kind === "state" && g.state === s) : [];
  const seen = new Set<string>();
  const out: GovSite[] = [];
  for (const g of [...cityHits, ...stateLocal, ...statePortal, ...FEDERAL]) {
    if (seen.has(g.id)) continue;
    seen.add(g.id);
    out.push(g);
  }
  return out;
}

/** Pick one site at random across the full pool. Pass a seed for stable picks
 *  (so server + client agree on the same random choice during hydration). */
export function pickRandomSite(seed?: number): GovSite {
  const idx = seed == null ? Math.floor(Math.random() * GOV_SITES.length) : Math.abs(seed) % GOV_SITES.length;
  return GOV_SITES[idx];
}

/** Best single-site recommendation for a viewer:
 *   1. Their specific city, if we have it.
 *   2. Otherwise their state portal.
 *   3. Otherwise USA.gov.
 */
export function pickLocalSite(city: string | null | undefined, state: string | null | undefined): GovSite {
  const c = normCity(city);
  const s = normState(state);
  if (c) {
    const hit = GOV_SITES.find((g) => g.city === c);
    if (hit) return hit;
  }
  if (s) {
    const hit = GOV_SITES.find((g) => g.kind === "state" && g.state === s);
    if (hit) return hit;
  }
  return GOV_SITES.find((g) => g.id === "fed-usa")!;
}

/** Look up a site by id (used by the chooser to round-trip a typed pick). */
export function siteById(id: string): GovSite | undefined {
  return GOV_SITES.find((g) => g.id === id);
}
