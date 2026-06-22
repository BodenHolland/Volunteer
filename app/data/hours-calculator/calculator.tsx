"use client";

import { useMemo, useState } from "react";
import {
  Calculator,
  ExternalLink,
  Info,
  AlertTriangle,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import {
  calculate,
  getJurisdictionsForState,
  getStateStatus,
  getWorkfareIfRegistered,
  STATE_LIST,
  EXEMPTIONS,
  type ExemptionKey,
} from "@/lib/abawd-calc";

type AgeAnswer = "unset" | "in_range" | "out_of_range";

type Selection = {
  state: string;
  householdSize: number;
  jurisdictionKey?: string;
  allotmentOverride: string;
  ageAnswer: AgeAnswer;
  exemptions: Record<ExemptionKey, boolean>;
};

const emptyExemptions = EXEMPTIONS.reduce(
  (acc, e) => ({ ...acc, [e.key]: false }),
  {} as Record<ExemptionKey, boolean>,
);

export function HoursCalculator() {
  const [sel, setSel] = useState<Selection>({
    state: "CA",
    householdSize: 1,
    jurisdictionKey: undefined,
    allotmentOverride: "",
    ageAnswer: "unset",
    exemptions: emptyExemptions,
  });

  const jurisdictions = useMemo(
    () => getJurisdictionsForState(sel.state),
    [sel.state],
  );

  const stateStatus = useMemo(() => getStateStatus(sel.state), [sel.state]);
  const workfareAlt = useMemo(
    () => getWorkfareIfRegistered(sel.state, sel.householdSize),
    [sel.state, sel.householdSize],
  );

  const exemptKeys = useMemo(
    () => (Object.keys(sel.exemptions) as ExemptionKey[]).filter((k) => sel.exemptions[k]),
    [sel.exemptions],
  );

  const outOfAgeRange = sel.ageAnswer === "out_of_range";
  const isExempt = outOfAgeRange || exemptKeys.length > 0;

  const parsedOverride = Number.parseFloat(sel.allotmentOverride);
  const allotmentOverrideUsd =
    Number.isFinite(parsedOverride) && parsedOverride > 0 ? parsedOverride : undefined;

  const result = useMemo(
    () =>
      calculate({
        state: sel.state,
        householdSize: sel.householdSize,
        jurisdictionKey: sel.jurisdictionKey,
        allotmentOverrideUsd,
      }),
    [sel.state, sel.householdSize, sel.jurisdictionKey, allotmentOverrideUsd],
  );

  function changeState(nextState: string) {
    const j = getJurisdictionsForState(nextState);
    setSel((s) => ({ ...s, state: nextState, jurisdictionKey: j?.defaultKey }));
  }

  function changeJurisdiction(nextKey: string) {
    setSel((s) => ({ ...s, jurisdictionKey: nextKey }));
  }

  function changeHouseholdSize(nextSize: number) {
    setSel((s) => ({ ...s, householdSize: nextSize }));
  }

  function changeAllotmentOverride(next: string) {
    setSel((s) => ({ ...s, allotmentOverride: next }));
  }

  function setAge(next: AgeAnswer) {
    setSel((s) => ({ ...s, ageAnswer: next }));
  }

  function toggleExemption(key: ExemptionKey) {
    setSel((s) => ({ ...s, exemptions: { ...s.exemptions, [key]: !s.exemptions[key] } }));
  }

  const stateName = STATE_LIST.find((s) => s.code === sel.state)?.name ?? sel.state;
  const isWorkfare = result.formula === "workfare_allotment_over_minwage";
  const exemptionReason = outOfAgeRange
    ? "You're outside the 18–64 ABAWD age range — the work requirement doesn't apply to you."
    : `You qualify for an ABAWD exemption: ${exemptKeys
        .map((k) => EXEMPTIONS.find((e) => e.key === k)?.label.toLowerCase())
        .filter(Boolean)
        .join("; ")}.`;

  return (
    <div className="space-y-6">
      <section className="service-panel p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck
            className="mt-0.5 size-5 shrink-0 text-forest"
            strokeWidth={1.75}
            aria-hidden
          />
          <div>
            <h2 className="text-base font-semibold text-ink">Eligibility check (federal)</h2>
            <p className="mt-1 text-sm text-body">
              Many people aren't subject to ABAWD at all. Run this 30-second check before relying
              on the hours number below.
            </p>
          </div>
        </div>

        <fieldset className="mt-5 border-t border-line pt-5">
          <legend className="text-sm font-medium text-ink">Are you between ages 18 and 64?</legend>
          <p className="mt-1 text-xs text-meta">
            OBBBA (2025) expanded ABAWD from 18–54 to 18–64. People outside that range aren't
            subject to the work requirement.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { v: "in_range" as const, label: "Yes, 18–64" },
              { v: "out_of_range" as const, label: "No, outside 18–64" },
              { v: "unset" as const, label: "Skip for now" },
            ].map((opt) => {
              const active = sel.ageAnswer === opt.v;
              return (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setAge(opt.v)}
                  className={
                    active
                      ? "rounded-md border border-forest bg-forest-subtle px-3 py-1.5 text-sm font-medium text-forest"
                      : "rounded-md border border-line bg-white px-3 py-1.5 text-sm text-body hover:border-forest"
                  }
                  aria-pressed={active}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mt-5 border-t border-line pt-5">
          <legend className="text-sm font-medium text-ink">Do any of these apply?</legend>
          <p className="mt-1 text-xs text-meta">
            Check any that are true. Each is a federal exemption under 7 CFR §273.24(b).
          </p>
          <ul className="mt-3 space-y-2">
            {EXEMPTIONS.map((e) => (
              <li key={e.key}>
                <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line bg-white p-3 hover:border-forest">
                  <input
                    type="checkbox"
                    checked={sel.exemptions[e.key]}
                    onChange={() => toggleExemption(e.key)}
                    className="mt-0.5 size-4 shrink-0 accent-forest"
                  />
                  <span className="text-sm">
                    <span className="font-medium text-ink">{e.label}</span>
                    <span className="mt-0.5 block text-xs text-meta">{e.hint}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </section>

      <div className="grid gap-6 md:grid-cols-[360px_1fr]">
        <form
          className="service-panel p-6 shadow-sm"
          onSubmit={(e) => e.preventDefault()}
        >
          <fieldset className="space-y-5">
            <legend className="overline mb-4">Inputs</legend>

            <label className="block">
              <span className="block text-sm font-medium text-ink">State</span>
              <select
                value={sel.state}
                onChange={(e) => changeState(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-forest"
              >
                {STATE_LIST.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            {jurisdictions && (
              <label key={sel.state} className="block">
                <span className="block text-sm font-medium text-ink">Region within state</span>
                <select
                  value={sel.jurisdictionKey ?? jurisdictions.defaultKey}
                  onChange={(e) => changeJurisdiction(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-forest"
                >
                  {jurisdictions.jurisdictions.map((j) => (
                    <option key={j.key} value={j.key}>
                      {j.label} — ${j.minimum_wage_usd.toFixed(2)}/hr
                    </option>
                  ))}
                </select>
                <span className="mt-1.5 block text-xs text-meta">
                  {stateName} has multiple minimum-wage zones — pick yours.
                </span>
              </label>
            )}

            <label className="block">
              <span className="block text-sm font-medium text-ink">Household size</span>
              <select
                value={sel.householdSize}
                onChange={(e) => changeHouseholdSize(Number(e.target.value))}
                className="mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-forest"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "person" : "people"}
                  </option>
                ))}
              </select>
              <span className="mt-1.5 block text-xs text-meta">
                In workfare-formula states, household allotment drives required hours.
              </span>
            </label>

            {isWorkfare && (
              <label className="block">
                <span className="block text-sm font-medium text-ink">
                  Your actual monthly SNAP amount{" "}
                  <span className="font-normal text-meta">(optional)</span>
                </span>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-sm text-meta">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={1}
                    value={sel.allotmentOverride}
                    onChange={(e) => changeAllotmentOverride(e.target.value)}
                    placeholder={`Up to ${result.allotmentUsd}`}
                    className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-forest"
                  />
                </div>
                <span className="mt-1.5 block text-xs text-meta">
                  If you receive less than the max allotment, enter your actual figure for a
                  personalized hours number.
                </span>
              </label>
            )}
          </fieldset>
        </form>

        <div className="space-y-4">
          {isExempt ? (
            <ExemptResult reason={exemptionReason} stateName={stateName} />
          ) : (
            <HoursResult
              monthlyHours={result.monthlyHours}
              explanation={result.explanation}
              stateName={stateName}
              householdSize={sel.householdSize}
              isWorkfare={isWorkfare}
              allotmentUsd={result.allotmentUsd}
              minimumWageUsd={result.minimumWageUsd}
              allotmentSource={result.allotmentSource}
            />
          )}

          {workfareAlt && !isExempt && (
            <WorkfareAlternativePanel alt={workfareAlt} stateName={stateName} />
          )}

          {stateStatus && !isExempt && (
            <StateStatusPanel status={stateStatus} stateName={stateName} />
          )}

          <div className="service-panel flex items-start gap-3 p-5">
            <Info
              className="mt-0.5 size-[18px] shrink-0 text-forest"
              strokeWidth={1.75}
              aria-hidden
            />
            <div className="text-sm text-body">
              <p>
                Data current as of{" "}
                <span className="font-medium text-ink">{result.asOf}</span>. Next scheduled
                review: <span className="font-medium text-ink">{result.nextReviewBy}</span>.
                {result.policySourceUrl && (
                  <>
                    {" "}
                    <a
                      href={result.policySourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-forest underline-offset-2 hover:underline"
                    >
                      State policy source <ExternalLink className="inline size-[14px]" />
                    </a>
                  </>
                )}
              </p>
              <p className="mt-1.5 text-xs text-meta">
                SNAP allotments come from USDA FNS (FY2026). Minimum wage figures from each
                state's labor department. Exemption checks reflect the federal 7 CFR §273.24(b)
                list — some states add categories beyond this.
              </p>
            </div>
          </div>

          {result.staleWarning && (
            <div className="service-panel flex items-start gap-3 border-amber/40 bg-amber-subtle p-5">
              <AlertTriangle
                className="mt-0.5 size-[18px] shrink-0 text-amber"
                strokeWidth={1.75}
                aria-hidden
              />
              <p className="text-sm text-body">
                This number is past its scheduled review date. Verify directly with the state SNAP
                agency before relying on it for casework.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HoursResult(props: {
  monthlyHours: number;
  explanation: string;
  stateName: string;
  householdSize: number;
  isWorkfare: boolean;
  allotmentUsd?: number;
  minimumWageUsd?: number;
  allotmentSource?: "max_for_household" | "user_provided";
}) {
  const {
    monthlyHours,
    explanation,
    stateName,
    householdSize,
    isWorkfare,
    allotmentUsd,
    minimumWageUsd,
    allotmentSource,
  } = props;
  return (
    <div className="service-panel p-8 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-forest-subtle text-forest">
          <Calculator className="size-6" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="overline mb-2">
            {stateName} · household of {householdSize}
          </p>
          <p className="text-[44px] font-semibold leading-none text-navy md:text-[56px]">
            {monthlyHours}
            <span className="ml-2 text-base font-medium text-meta">hours / month</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-body">{explanation}</p>
        </div>
      </div>

      {isWorkfare && allotmentUsd != null && minimumWageUsd != null && (
        <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-5 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-meta">
              {allotmentSource === "user_provided" ? "Your allotment" : "Max allotment"}
            </dt>
            <dd className="mt-0.5 font-medium text-ink">${allotmentUsd}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-meta">Minimum wage</dt>
            <dd className="mt-0.5 font-medium text-ink">${minimumWageUsd.toFixed(2)}/hr</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-meta">Hours basis</dt>
            <dd className="mt-0.5 font-medium text-ink">Workfare formula</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

function WorkfareAlternativePanel({
  alt,
  stateName,
}: {
  alt: NonNullable<ReturnType<typeof getWorkfareIfRegistered>>;
  stateName: string;
}) {
  return (
    <div className="service-panel border-amber/40 bg-amber-subtle p-5">
      <div className="flex items-start gap-3">
        <Info
          className="mt-0.5 size-[18px] shrink-0 text-amber"
          strokeWidth={1.75}
          aria-hidden
        />
        <div className="text-sm text-body">
          <p className="font-medium text-ink">
            {stateName} offers a lower-hours path for registered sites
          </p>
          <p className="mt-1">
            If you volunteer at a site registered with the state as{" "}
            <span className="font-medium text-ink">{alt.pathName}</span>, your required hours drop
            to <span className="font-medium text-ink">{alt.alternativeHoursAtMaxAllotment} hours/month</span>{" "}
            (SNAP allotment ÷ ${alt.minimumWageUsd.toFixed(2)}). Generic 501(c)(3) volunteering
            stays at 80.
          </p>
          <p className="mt-1.5 text-xs text-meta">
            Requirement: {alt.requirement}.{" "}
            <a
              href={alt.policySourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-forest underline-offset-2 hover:underline"
            >
              Read state policy <ExternalLink className="inline size-[12px]" />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function StateStatusPanel({
  status,
  stateName,
}: {
  status: ReturnType<typeof getStateStatus>;
  stateName: string;
}) {
  if (!status) return null;
  const accent =
    status.enforcement === "enforcing"
      ? "border-line bg-white"
      : status.enforcement === "waived"
        ? "border-forest/30 bg-forest-subtle/50"
        : "border-amber/40 bg-amber-subtle";
  return (
    <details className={`service-panel ${accent} p-5`}>
      <summary className="flex cursor-pointer items-start gap-3 [&::-webkit-details-marker]:hidden">
        <MapPin
          className="mt-0.5 size-[18px] shrink-0 text-forest"
          strokeWidth={1.75}
          aria-hidden
        />
        <div className="flex-1">
          <p className="overline mb-1">{stateName} · OBBBA enforcement</p>
          <p className="text-sm font-medium text-ink">{status.shortLabel}</p>
          <p className="mt-1 text-xs text-meta">
            {status.administration === "county"
              ? `Administered at the county level${status.countyVariation ? " — implementation varies" : ""}.`
              : "Administered at the state level."}{" "}
            <span className="font-medium text-forest underline-offset-2 group-open:underline">
              View waiver detail
            </span>
          </p>
        </div>
      </summary>
      <p className="mt-4 border-t border-line pt-4 text-sm leading-relaxed text-body">
        {status.waiverText}
      </p>
    </details>
  );
}

function ExemptResult({ reason, stateName }: { reason: string; stateName: string }) {
  return (
    <div className="service-panel border-forest/30 bg-forest-subtle/50 p-8 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white text-forest">
          <ShieldCheck className="size-6" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="overline mb-2">{stateName} · exempt</p>
          <p className="text-[36px] font-semibold leading-none text-navy md:text-[44px]">
            0
            <span className="ml-2 text-base font-medium text-meta">hours required</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-body">{reason}</p>
          <p className="mt-3 text-xs text-meta">
            You may still benefit from volunteering — Tended welcomes anyone, exempt or not. But
            you don't need a CF 888-style verification form to keep your SNAP benefits.
          </p>
        </div>
      </div>
    </div>
  );
}
