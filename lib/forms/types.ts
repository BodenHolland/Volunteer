/**
 * Shared data shape for every state's volunteer-hours verification PDF.
 *
 * One per-month, per-certifying-org form. Optional fields are surfaced in
 * states whose form asks for them (e.g. MO needs DCN + position description).
 */
export interface StateFormData {
  // Section 1 — recipient
  participantName: string;
  birthdate: string;            // mm/dd/yyyy
  participantAddress: string[]; // [line1, "city, state zip", ""]
  participantPhone?: string;
  caseNumber?: string;          // DCN/case # — used by MO, GA, others

  // Section 2 — certifying org
  orgName: string;
  representativeName: string;
  representativeTitle?: string;
  orgAddress: string[];         // same shape as participantAddress
  orgPhone: string;
  orgEmail?: string;

  // Certification
  month: string;                // human label, e.g. "June 2026"
  monthIso: string;             // "2026-06"
  hours: number;
  /**
   * "ongoing"  — volunteer worked multiple sessions spread across the month.
   *              Derive from submission: timeLog.sessions.length > 1.
   * "one_time" — a single session or event. Use when sessions.length === 1.
   */
  activity: "ongoing" | "one_time";
  positionDescription?: string; // MO-style "what did they do"
  startDate?: string;           // mm/dd/yyyy — some states ask
  signatureName: string;
  dateSigned: string;           // mm/dd/yyyy
}

export type StateBuilder = (data: StateFormData) => Promise<Uint8Array>;

export interface StateFormSpec {
  /** Two-letter state code, uppercase. */
  state: string;
  /** Form identifier shown to the user, e.g. "FIA 500-B". */
  formId: string;
  /** Human-readable description of submission path. */
  submissionNotes: string;
  /** Where to submit (portal URL preferred, else mailing address line). */
  submissionTarget: string;
  /** Whether the form is mandatory or one of several accepted documents. */
  optional: boolean;
  /** Official state-issued PDF or Tended organization documentation. */
  kind: "official" | "certificate";
  build: StateBuilder;
}
