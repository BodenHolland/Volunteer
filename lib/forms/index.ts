/**
 * State-form dispatcher.
 *
 * `buildStateForm(state, data)` returns the volunteer-hours verification PDF
 * appropriate for the recipient's state — the named state form when one
 * exists, or a generic Tended-branded verification letter otherwise.
 *
 * Coverage today:
 *   - Named form: CA, MD, MO, CO, GA, DC, IL, AR, ME
 *   - Generic letter (federal documentary-evidence default): everywhere else
 *
 * `getStateFormSpec(state)` returns metadata (form ID, submission target,
 * notes, optional/mandatory) for UI surfaces.
 */
import { buildCf888Pdf } from "@/lib/cf888";
import { buildARPdf } from "./ar";
import { buildCOPdf } from "./co";
import { buildDCPdf } from "./dc";
import { buildGAPdf } from "./ga";
import { buildILPdf } from "./il";
import { buildMDPdf } from "./md";
import { buildMEPdf } from "./me";
import { buildMOPdf } from "./mo";
import { buildLetterPdf } from "./letter";
import type { StateFormData, StateFormSpec } from "./types";

const STATE_NAME: Record<string, string> = {
  AK: "Alaska", AL: "Alabama", AR: "Arkansas", AZ: "Arizona", CA: "California",
  CO: "Colorado", CT: "Connecticut", DC: "District of Columbia", DE: "Delaware",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", IA: "Iowa", ID: "Idaho",
  IL: "Illinois", IN: "Indiana", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  MA: "Massachusetts", MD: "Maryland", ME: "Maine", MI: "Michigan",
  MN: "Minnesota", MO: "Missouri", MS: "Mississippi", MT: "Montana",
  NC: "North Carolina", ND: "North Dakota", NE: "Nebraska", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NV: "Nevada", NY: "New York", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island",
  SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas",
  UT: "Utah", VA: "Virginia", VT: "Vermont", WA: "Washington",
  WI: "Wisconsin", WV: "West Virginia", WY: "Wyoming",
};

interface NamedForm {
  formId: string;
  submissionTarget: string;
  submissionNotes: string;
  optional: boolean;
  build: (data: StateFormData) => Promise<Uint8Array>;
}

const NAMED_FORMS: Record<string, NamedForm> = {
  CA: {
    formId: "CF 888",
    submissionTarget: "https://www.BenefitsCal.com",
    submissionNotes:
      "Upload the completed CF 888 to your BenefitsCal account, submit by mail, or deliver in person to your county office.",
    optional: true,
    build: (d) =>
      buildCf888Pdf({
        participantName: d.participantName,
        birthdate: d.birthdate,
        participantAddress: d.participantAddress,
        orgName: d.orgName,
        representativeName: d.representativeName,
        orgAddress: d.orgAddress,
        orgPhone: d.orgPhone,
        month: d.month,
        hours: d.hours,
        activity: d.activity,
        signatureName: d.signatureName,
        dateSigned: d.dateSigned,
      }),
  },
  MD: {
    formId: "FIA 500-B",
    submissionTarget: "https://mymdthink.maryland.gov",
    submissionNotes:
      "Upload the signed FIA 500-B to the Maryland Benefits Consumer Portal (mymdthink.maryland.gov), submit by mail or fax, or deliver in person to your LDSS office.",
    optional: false,
    build: buildMDPdf,
  },
  MO: {
    formId: "ABAWD Volunteer Agreement",
    submissionTarget: "DSS.FSD.Agreements@dss.mo.gov",
    submissionNotes:
      "Email the signed agreement to DSS.FSD.Agreements@dss.mo.gov or mail to Family Support Division, 3415 Division Drive, Suite 1, West Plains, MO 65775.",
    optional: false,
    build: buildMOPdf,
  },
  CO: {
    formId: "ABAWD Volunteer Verification Form",
    submissionTarget: "https://peak.my.gov.co",
    submissionNotes:
      "Upload via Colorado PEAK (peak.my.gov.co) or the MyCOBenefits app, or return to your county office in person or by mail. Required once per certification period.",
    optional: false,
    build: buildCOPdf,
  },
  GA: {
    formId: "Form 805",
    submissionTarget: "Local DFCS county office",
    submissionNotes:
      "Return the completed Form 805 to your SNAP eligibility specialist at your local DFCS county office.",
    optional: false,
    build: buildGAPdf,
  },
  DC: {
    formId: "Verification of Employment or Qualifying Work Activity Form",
    submissionTarget: "https://districtdirect.dc.gov",
    submissionNotes:
      "Upload via District Direct (districtdirect.dc.gov), submit in person at a DHS service center, or mail/fax to DC DHS.",
    optional: false,
    build: buildDCPdf,
  },
  IL: {
    formId: "IL444-2610",
    submissionTarget: "IDHS Manage My Case",
    submissionNotes:
      "Upload via IDHS Manage My Case, mail/fax to the IDHS Central Scanning Unit, or hand-deliver to your local FCRC. The IL444-2610 is OPTIONAL — a signed organization letter is also accepted.",
    optional: true,
    build: buildILPdf,
  },
  AR: {
    formId: "DCO-261",
    submissionTarget: "Local DHS county office",
    submissionNotes:
      "Return the completed DCO-261 Volunteer Agreement to your local Arkansas DHS county office eligibility worker.",
    optional: false,
    build: buildARPdf,
  },
  ME: {
    formId: "ABAWD Volunteer Form",
    submissionTarget: "Farmington.DHHS@Maine.gov",
    submissionNotes:
      "Email to Farmington.DHHS@Maine.gov, fax to (207) 778-8429, mail to Farmington DHHS (114 Corn Shop Lane, Farmington, ME 04938), or upload to MyMaineConnection.gov.",
    optional: false,
    build: buildMEPdf,
  },
};

/**
 * State-specific submission notes for the generic letter path
 * (states with no named form). These appear in the letter footer and the UI.
 */
const LETTER_SUBMISSION_NOTES: Record<string, string> = {
  AK: "Submit through the Alaska ARIES portal, by mail, or in person at your local DPA office.",
  AL: "Submit through MyDHR (mydhr.alabama.gov) or in person at your local DHR office.",
  AZ: "Submit via Health-e-Arizona Plus (healthearizonaplus.gov), by mail, or in person at your DES local office. Note: DES no longer accepts client self-statements — third-party (org-signed) documentation is required.",
  CT: "Upload via MyDSS (Connecticut), by mail, or in person at your local DSS field office.",
  DE: "Submit through DSS ASSIST (assist.dhss.delaware.gov), by mail, or in person at your local DSS office.",
  FL: "Upload to your My ACCESS Florida account, by mail, fax, or in person at a DCF service center.",
  HI: "Submit by mail or in person at your local Hawaii DHS office.",
  IA: "Upload via the Iowa HHS portal or submit at your local DHS office.",
  ID: "Submit through idalink.idaho.gov, by mail, or in person at your local Health & Welfare office.",
  IN: "Submit via FSSA Benefits Portal, by mail, or in person at your DFR local office.",
  KS: "Upload via the Kansas DCF self-service portal, by mail, or in person at your local DCF office.",
  KY: "Upload via kynect (kynect.ky.gov) or submit in person at your local DCBS office.",
  LA: "Submit via LAHelpU (lahelpu.dcfs.la.gov), by mail, fax, or in person at your local DCFS office.",
};

const NO_NAMED_FORM_STATES = new Set(Object.keys(LETTER_SUBMISSION_NOTES));

/** Look up form metadata for a state. Falls back to the generic letter spec. */
export function getStateFormSpec(state: string): StateFormSpec {
  const code = (state || "").toUpperCase();
  const named = NAMED_FORMS[code];
  if (named) {
    return {
      state: code,
      formId: named.formId,
      submissionNotes: named.submissionNotes,
      submissionTarget: named.submissionTarget,
      optional: named.optional,
      build: named.build,
    };
  }
  const stateName = STATE_NAME[code] || code || "your state";
  const submissionNotes =
    LETTER_SUBMISSION_NOTES[code] ||
    `Follow your ${stateName} SNAP agency's documentary-evidence path — typically a portal upload, mail, fax, or in-person delivery to your local office.`;
  return {
    state: code,
    formId: "Verification Letter",
    submissionNotes,
    submissionTarget: stateName,
    optional: true,
    build: (data) =>
      buildLetterPdf(data, {
        stateName,
        submissionLine: submissionNotes,
      }),
  };
}

/** Build the appropriate PDF for the recipient's state. */
export async function buildStateForm(
  state: string,
  data: StateFormData
): Promise<{ pdf: Uint8Array; spec: StateFormSpec }> {
  const spec = getStateFormSpec(state);
  const pdf = await spec.build(data);
  return { pdf, spec };
}

/** Useful for UI lists / admin. */
export function listStateFormCoverage(): Array<{
  state: string;
  stateName: string;
  formId: string;
  kind: "named" | "letter";
}> {
  return Object.keys(STATE_NAME).map((code) => {
    const named = NAMED_FORMS[code];
    return {
      state: code,
      stateName: STATE_NAME[code],
      formId: named ? named.formId : "Verification Letter",
      kind: named ? "named" : "letter",
    };
  });
}

export { NO_NAMED_FORM_STATES };
