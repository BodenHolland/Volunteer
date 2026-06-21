/**
 * Volunteer trust tiers — pure functions for tier transitions and
 * tier-derived strictness. See handoff §5.5.
 *
 * Tier 0 (new):      100% spot-review sampling, ±10% OCR tolerance
 * Tier 1 (10+ clean): 10% sampling, ±15% OCR tolerance
 * Tier 2 (30+ at T1):  3% sampling, ±20% OCR tolerance
 *
 * Any tier demotes to 0 on 2+ failed audits in a 30-day window.
 */

export interface TrustRow {
  user_id: string;
  tier: number;
  audits_completed: number;
  audits_flagged: number;
  audits_rejected: number;
  failed_audits_30_day_window: number;
  last_recalculated_at: number;
}

export interface TrustParams {
  prevTier: number;
  auditsCompleted: number; // verified audits count
  failedLast30Days: number; // rejected + block-severity flagged
  tier1HeldDays: number; // how long they've been at tier 1
}

export function nextTier(p: TrustParams): number {
  if (p.failedLast30Days >= 2) return 0;
  if (p.prevTier >= 1 && p.auditsCompleted >= 30 && p.tier1HeldDays >= 30) return 2;
  if (p.prevTier >= 0 && p.auditsCompleted >= 10 && p.failedLast30Days === 0) return 1;
  return p.prevTier;
}

export interface TierStrictness {
  ocrTolerance: number; // fraction; e.g. 0.10 means ±10%
  sampleRate: number; // 0..1 chance of flagging a clean verified audit
}

export function strictnessForTier(tier: number): TierStrictness {
  if (tier >= 2) return { ocrTolerance: 0.2, sampleRate: 0.03 };
  if (tier === 1) return { ocrTolerance: 0.15, sampleRate: 0.1 };
  return { ocrTolerance: 0.1, sampleRate: 1.0 };
}

/** Deterministic-enough random source. */
export function rollSample(rate: number): boolean {
  if (rate <= 0) return false;
  if (rate >= 1) return true;
  return Math.random() < rate;
}
