/**
 * Fraud signal checks. Pure functions over already-extracted data so they can
 * be unit-tested without a DB or network.
 */
import type { AiVerdict } from "./ai";
import { haversineMiles } from "./geo";

export type FlagKind =
  | "duplicate_image"
  | "likely_ai_content"
  | "geotag_mismatch"
  | "velocity_anomaly";

export type Severity = "warn" | "flag" | "block";

export interface FraudFlag {
  kind: FlagKind;
  severity: Severity;
  evidence?: Record<string, unknown>;
}

/** UI copy bank. */
export const FLAG_LABELS: Record<FlagKind, { label: string; tone: "error" | "amber" }> = {
  duplicate_image: { label: "Duplicate image", tone: "error" },
  likely_ai_content: { label: "Likely AI-generated content", tone: "error" },
  geotag_mismatch: { label: "Geotag doesn't match task area", tone: "amber" },
  velocity_anomaly: { label: "Submitted faster than estimated", tone: "amber" },
};

export interface LatLng {
  lat: number;
  lng: number;
}

/** Approximate city centroids for the geotag check. */
export const CITY_CENTROIDS: Record<string, LatLng> = {
  Sacramento: { lat: 38.5816, lng: -121.4944 },
  "Los Angeles": { lat: 34.0522, lng: -118.2437 },
  Fresno: { lat: 36.7378, lng: -119.7871 },
};

// Re-exported from the shared geo module; kept here for existing import paths.
export { haversineMiles };

export interface CurrentFile {
  fileId: string;
  hash: string;
}
export interface PriorFile {
  submissionId: string;
  fileId: string;
  hash: string;
}

/** a. SHA-256 duplicate across all prior submission files. */
export function detectDuplicateImages(
  current: CurrentFile[],
  prior: PriorFile[]
): FraudFlag[] {
  const flags: FraudFlag[] = [];
  const priorByHash = new Map(prior.map((p) => [p.hash, p]));
  // also catch duplicates *within* this submission
  const seen = new Set<string>();
  for (const f of current) {
    const match = priorByHash.get(f.hash);
    if (match) {
      flags.push({
        kind: "duplicate_image",
        severity: "flag",
        evidence: { matched_submission_id: match.submissionId, matched_file_id: match.fileId },
      });
    } else if (seen.has(f.hash)) {
      flags.push({
        kind: "duplicate_image",
        severity: "flag",
        evidence: { matched_file_id: f.fileId, within_submission: true },
      });
    }
    seen.add(f.hash);
  }
  return flags;
}

/** b. AI verdict flagged the content as AI-generated. */
export function detectAiContent(verdict: AiVerdict): FraudFlag[] {
  const mentionsAi = /ai[- ]generated/i.test(verdict.reasoning);
  if (verdict.suspected_ai_content || mentionsAi) {
    return [{ kind: "likely_ai_content", severity: "flag", evidence: { reasoning: verdict.reasoning } }];
  }
  return [];
}

/** c. in_person task + EXIF geotag > 2 miles from the recipient's city centroid. */
export function detectGeotagMismatch(
  locationKind: string,
  geos: LatLng[],
  centroid: LatLng | undefined
): FraudFlag[] {
  if (locationKind !== "in_person" || !centroid || geos.length === 0) return [];
  for (const g of geos) {
    const miles = haversineMiles(g, centroid);
    if (miles > 2) {
      return [
        {
          kind: "geotag_mismatch",
          severity: "warn",
          evidence: { miles: Math.round(miles * 10) / 10, geo: g },
        },
      ];
    }
  }
  return [];
}

/** d. Submitted in < 30% of estimated time. */
export function detectVelocityAnomaly(
  submittedAt: number,
  firstStartedAt: number | null,
  estHours: number
): FraudFlag[] {
  if (!firstStartedAt || !estHours) return [];
  const elapsedSec = (submittedAt - firstStartedAt) / 1000;
  const threshold = estHours * 3600 * 0.3;
  if (elapsedSec < threshold) {
    return [
      {
        kind: "velocity_anomaly",
        severity: "warn",
        evidence: {
          elapsed_minutes: Math.round(elapsedSec / 60),
          expected_minutes: Math.round((estHours * 3600) / 60),
        },
      },
    ];
  }
  return [];
}

/** Status routing per the spec. */
export function routeStatus(
  verdict: AiVerdict,
  flags: FraudFlag[]
): "pending_review" | "rejected" | "needs_changes" {
  if (flags.some((f) => f.severity === "block")) return "needs_changes";
  // A validator rejection is terminal under the submission state machine.
  if (verdict.verdict === "reject") return "rejected";
  return "pending_review";
}
