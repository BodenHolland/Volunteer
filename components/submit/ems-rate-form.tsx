"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Shuffle } from "lucide-react";
import { rerollEmsAssignment } from "@/app/app/projects/[id]/submit-actions";
import type { EmsRateAssignment, EmsRateData, EmsRateField } from "@/lib/types";

interface Props {
  assignment: EmsRateAssignment | null;
  defaults: EmsRateData | null;
}

interface RateRowProps {
  prefix: "bls" | "als" | "mileage" | "tnt";
  label: string;
  hint: string;
  amountPlaceholder: string;
  initial: EmsRateField;
}

function RateRow({ prefix, label, hint, amountPlaceholder, initial }: RateRowProps) {
  const [notFound, setNotFound] = useState(initial.not_found);
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{label}</p>
          <p className="text-xs text-meta">{hint}</p>
        </div>
        <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md border border-line bg-section px-2.5 py-1.5 text-xs font-medium text-body">
          <input
            type="checkbox"
            name={`ems_${prefix}_not_found`}
            value="1"
            defaultChecked={initial.not_found}
            onChange={(e) => setNotFound(e.target.checked)}
            className="size-3.5 accent-[var(--color-forest)]"
          />
          Couldn&apos;t find
        </label>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[160px_1fr]">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-meta">$</span>
          <Input
            name={`ems_${prefix}_amount`}
            type="number"
            min="0"
            step="0.01"
            placeholder={amountPlaceholder}
            defaultValue={initial.amount}
            disabled={notFound}
            className="pl-6"
          />
        </div>
        <Input
          name={`ems_${prefix}_source_url`}
          type="url"
          placeholder="https://… link to the document that shows this rate"
          defaultValue={initial.source_url}
          disabled={notFound}
        />
      </div>
    </div>
  );
}

const EMPTY_FIELD: EmsRateField = { amount: "", source_url: "", not_found: false };

export function EmsRateForm({ assignment, defaults }: Props) {
  const d: EmsRateData = defaults ?? {
    assignment: assignment ?? { provider_name: "", city: "", state: "" },
    public_session_ref: "",
    bls: { ...EMPTY_FIELD },
    als: { ...EMPTY_FIELD },
    mileage: { ...EMPTY_FIELD },
    tnt: { ...EMPTY_FIELD },
    tnt_description: "",
    effective_date: "",
    zip_codes: "",
    notes: "",
  };
  const a = assignment ?? d.assignment;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border-2 border-forest bg-forest-subtle p-4">
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 size-4 shrink-0 text-forest" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-forest">Researching</p>
            {a.provider_name ? (
              <>
                <p className="mt-0.5 text-base font-semibold text-ink">{a.provider_name}</p>
                {(a.city || a.state) && (
                  <p className="text-sm text-body">{a.city}{a.city && a.state ? ", " : ""}{a.state}</p>
                )}
              </>
            ) : (
              <>
                <p className="mt-0.5 text-base font-semibold text-ink">
                  EMS provider serving {a.city}{a.city && a.state ? ", " : ""}{a.state}
                </p>
                <p className="mt-1 text-sm text-body">
                  Your first task: find which agency (city fire dept, county EMS, private contractor) bills ambulance transports in this area, then look up its rates.
                </p>
              </>
            )}
          </div>
        </div>
        <input type="hidden" name="ems_assignment_provider_name" value={a.provider_name} />
        <input type="hidden" name="ems_assignment_city" value={a.city} />
        <input type="hidden" name="ems_assignment_state" value={a.state} />
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            formAction={rerollEmsAssignment}
            formNoValidate
            className="inline-flex items-center gap-1.5 rounded-md border border-forest bg-white px-2.5 py-1.5 text-xs font-medium text-forest hover:bg-forest-subtle"
          >
            <Shuffle className="size-3.5" />
            Try a different city
          </button>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-ink">Rates</legend>
        <p className="text-xs text-meta">
          For each rate, enter the dollar amount and the URL that proves it. If the provider doesn&apos;t
          publish a rate, check &ldquo;Couldn&apos;t find&rdquo; — that&apos;s also useful data.
        </p>
        <RateRow
          prefix="bls"
          label="BLS base rate"
          hint="Basic Life Support, before mileage"
          amountPlaceholder="1200.00"
          initial={d.bls}
        />
        <RateRow
          prefix="als"
          label="ALS base rate"
          hint="Advanced Life Support, before mileage"
          amountPlaceholder="1450.00"
          initial={d.als}
        />
        <RateRow
          prefix="mileage"
          label="Per-mile rate"
          hint="Loaded mileage rate per mile transported"
          amountPlaceholder="22.50"
          initial={d.mileage}
        />
        <RateRow
          prefix="tnt"
          label="Treat-no-transport (TNT) fee"
          hint="Charged when EMS responds but doesn't transport"
          amountPlaceholder="500.00"
          initial={d.tnt}
        />
        <div className="space-y-1.5">
          <Label htmlFor="ems_tnt_description">TNT description</Label>
          <Input
            id="ems_tnt_description"
            name="ems_tnt_description"
            placeholder="When does the TNT fee apply? (optional)"
            defaultValue={d.tnt_description}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-ink">Coverage &amp; context</legend>
        <div className="space-y-1.5">
          <Label htmlFor="ems_effective_date">Effective date</Label>
          <Input
            id="ems_effective_date"
            name="ems_effective_date"
            type="date"
            defaultValue={d.effective_date}
          />
          <p className="text-xs text-meta">When the rates above went into effect, if the source says.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ems_zip_codes">ZIP codes / service area</Label>
          <Input
            id="ems_zip_codes"
            name="ems_zip_codes"
            placeholder="78701, 78702… — or: all city limits"
            defaultValue={d.zip_codes}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ems_notes">Additional notes</Label>
          <Textarea
            id="ems_notes"
            name="ems_notes"
            placeholder="Service boundaries, rate history, special conditions, anything that was hard to pin down…"
            defaultValue={d.notes}
          />
        </div>
      </fieldset>
    </div>
  );
}
