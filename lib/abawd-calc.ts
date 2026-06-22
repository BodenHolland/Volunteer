import snapAllotments from "@/lib/data/abawd/snap-allotments.json";
import hoursByState from "@/lib/data/abawd/hours-by-state.json";
import stateStatusData from "@/lib/data/abawd/state-status.json";

type StateStatusRecord = {
  abawd_enforced_2026: "yes" | "no" | "partial";
  tier: string;
  geographic_waivers: string;
  county_variation_flag: boolean;
  administration: "state" | "county";
};

const STATE_STATUS = stateStatusData as Record<string, StateStatusRecord>;

export type StateStatus = {
  enforcement: "enforcing" | "waived" | "partial";
  shortLabel: string;
  hasWaivers: boolean;
  waiverText: string;
  countyVariation: boolean;
  administration: "state" | "county";
};

export function getStateStatus(stateCode: string): StateStatus | null {
  const record = STATE_STATUS[stateCode];
  if (!record) return null;

  const waiverText = (record.geographic_waivers ?? "").trim();
  const noWaivers =
    /^none/i.test(waiverText) || /fully enforced statewide/i.test(waiverText);

  const enforcement: StateStatus["enforcement"] =
    record.abawd_enforced_2026 === "no"
      ? "waived"
      : record.abawd_enforced_2026 === "partial"
        ? "partial"
        : noWaivers
          ? "enforcing"
          : "partial";

  const shortLabel =
    enforcement === "enforcing"
      ? "Enforcing statewide"
      : enforcement === "waived"
        ? "Statewide waiver in effect"
        : "Enforcing with partial geographic waivers";

  return {
    enforcement,
    shortLabel,
    hasWaivers: !noWaivers,
    waiverText,
    countyVariation: !!record.county_variation_flag,
    administration: record.administration,
  };
}

export type CalcInput = {
  state: string;
  householdSize: number;
  jurisdictionKey?: string;
  /** Optional override of the recipient's actual monthly SNAP allotment ($). When provided, replaces the household-max assumption in workfare-formula states. */
  allotmentOverrideUsd?: number;
};

export type CalcResult = {
  monthlyHours: number;
  formula: "federal_80" | "workfare_allotment_over_minwage";
  allotmentUsd?: number;
  allotmentSource?: "max_for_household" | "user_provided";
  minimumWageUsd?: number;
  jurisdictionLabel?: string;
  explanation: string;
  policySourceUrl?: string;
  asOf: string;
  nextReviewBy: string;
  staleWarning: boolean;
};

export type ExemptionKey =
  | "outside_age_range"
  | "pregnant"
  | "caring_for_child_under_6"
  | "caring_for_incapacitated"
  | "medically_unfit"
  | "working_30_plus"
  | "school_half_time"
  | "in_treatment";

export const EXEMPTIONS: { key: ExemptionKey; label: string; hint: string }[] = [
  {
    key: "pregnant",
    label: "I'm pregnant",
    hint: "Pregnant individuals are categorically exempt from ABAWD under 7 CFR §273.24(b).",
  },
  {
    key: "caring_for_child_under_6",
    label: "I'm responsible for a child under age 6 in my household",
    hint: "Federal exemption for caretakers of a child under 6 or an incapacitated person.",
  },
  {
    key: "caring_for_incapacitated",
    label: "I'm caring for an incapacitated family member",
    hint: "Same federal exemption as caring for a young child.",
  },
  {
    key: "medically_unfit",
    label: "I have a physical or mental condition that limits my ability to work",
    hint: "Medical unfitness is a federal exemption — written verification may be requested.",
  },
  {
    key: "working_30_plus",
    label: "I'm already working 30+ hours/week (or earning the equivalent)",
    hint: "If you already meet the work requirement, ABAWD volunteer hours aren't required.",
  },
  {
    key: "school_half_time",
    label: "I'm enrolled at least half-time in school or training",
    hint: "Half-time-or-more students are exempt; verify the program qualifies.",
  },
  {
    key: "in_treatment",
    label: "I'm in a substance use disorder treatment program",
    hint: "Treatment-program participants are federally exempt.",
  },
];

const ALLOTMENT_TABLE = snapAllotments.max_monthly_allotment_usd.contiguous_48_and_dc as Record<
  string,
  number
>;

function allotmentForHouseholdSize(size: number): number {
  const clamped = Math.max(1, Math.min(8, Math.floor(size)));
  if (size <= 8) return ALLOTMENT_TABLE[String(clamped)];
  const extras = Math.floor(size) - 8;
  return ALLOTMENT_TABLE["8"] + extras * ALLOTMENT_TABLE.each_additional;
}

export const STATE_LIST: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

type StateOverride = {
  formula: "workfare_allotment_over_minwage";
  minimum_wage_usd?: number;
  jurisdictions?: { key: string; label: string; minimum_wage_usd: number; source_url: string }[];
  default_jurisdiction?: string;
  policy_source_url?: string;
  minimum_wage_source_url?: string;
  note?: string;
};

const OVERRIDES = hoursByState.states as Record<string, StateOverride>;

export function getJurisdictionsForState(stateCode: string) {
  const o = OVERRIDES[stateCode];
  if (!o?.jurisdictions) return null;
  return { jurisdictions: o.jurisdictions, defaultKey: o.default_jurisdiction };
}

type WorkfareAlternative = {
  alternative_path_name: string;
  requirement: string;
  minimum_wage_usd: number;
  policy_source_url: string;
};

const WORKFARE_IF_REGISTERED = (
  hoursByState as unknown as {
    workfare_if_registered: Record<string, WorkfareAlternative>;
  }
).workfare_if_registered;

export type WorkfareIfRegistered = {
  pathName: string;
  requirement: string;
  minimumWageUsd: number;
  policySourceUrl: string;
  alternativeHoursAtMaxAllotment: number;
};

export function getWorkfareIfRegistered(
  stateCode: string,
  householdSize: number,
): WorkfareIfRegistered | null {
  const entry = WORKFARE_IF_REGISTERED?.[stateCode];
  if (!entry) return null;
  const effectiveWage = Math.max(
    entry.minimum_wage_usd,
    hoursByState.federal_minimum_wage_usd,
  );
  const allot = allotmentForHouseholdSize(householdSize);
  return {
    pathName: entry.alternative_path_name,
    requirement: entry.requirement,
    minimumWageUsd: effectiveWage,
    policySourceUrl: entry.policy_source_url,
    alternativeHoursAtMaxAllotment: Math.floor(allot / effectiveWage),
  };
}

export function calculate({
  state,
  householdSize,
  jurisdictionKey,
  allotmentOverrideUsd,
}: CalcInput): CalcResult {
  const override = OVERRIDES[state];
  const asOf = hoursByState.last_verified;
  const nextReviewBy = hoursByState.next_review_by;
  const today = new Date().toISOString().slice(0, 10);
  const staleWarning = today > nextReviewBy;

  if (!override || override.formula !== "workfare_allotment_over_minwage") {
    return {
      monthlyHours: hoursByState.federal_default_hours,
      formula: "federal_80",
      explanation:
        "This state follows the federal ABAWD baseline of 80 hours per month (or 20 hours per week) — uniform across the 45 jurisdictions that have not adopted the workfare formula for general nonprofit volunteering.",
      asOf,
      nextReviewBy,
      staleWarning,
    };
  }

  let minWage = override.minimum_wage_usd ?? hoursByState.federal_minimum_wage_usd;
  let jurisdictionLabel: string | undefined;
  const policySourceUrl = override.policy_source_url;

  if (override.jurisdictions) {
    const chosen =
      override.jurisdictions.find((j) => j.key === jurisdictionKey) ??
      override.jurisdictions.find((j) => j.key === override.default_jurisdiction) ??
      override.jurisdictions[0];
    minWage = chosen.minimum_wage_usd;
    jurisdictionLabel = chosen.label;
  }

  const effectiveWage = Math.max(minWage, hoursByState.federal_minimum_wage_usd);
  const maxAllotment = allotmentForHouseholdSize(householdSize);
  const usingOverride =
    typeof allotmentOverrideUsd === "number" &&
    allotmentOverrideUsd > 0 &&
    allotmentOverrideUsd <= maxAllotment;
  const allotment = usingOverride ? allotmentOverrideUsd! : maxAllotment;
  const monthlyHours = Math.floor(allotment / effectiveWage);

  const wagePhrase = `$${effectiveWage.toFixed(2)} ${jurisdictionLabel ? `${jurisdictionLabel} ` : ""}minimum wage`;
  const explanation = usingOverride
    ? `Computed as $${allotment} (your reported SNAP allotment) ÷ ${wagePhrase} = ${monthlyHours} hours/month.`
    : `Computed as $${allotment} max SNAP allotment (household of ${householdSize}) ÷ ${wagePhrase} = ${monthlyHours} hours/month. This is the upper bound — if you receive less than the max allotment, enter your actual amount to refine.`;

  return {
    monthlyHours,
    formula: "workfare_allotment_over_minwage",
    allotmentUsd: allotment,
    allotmentSource: usingOverride ? "user_provided" : "max_for_household",
    minimumWageUsd: effectiveWage,
    jurisdictionLabel,
    explanation,
    policySourceUrl,
    asOf,
    nextReviewBy,
    staleWarning,
  };
}
