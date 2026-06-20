/**
 * Hours integrity (Change 4): the credit basis is *measured active engagement*,
 * not wall-clock or a task estimate. A second only counts as "active" when the
 * tab is visible and the volunteer interacted within the idle threshold.
 */
export const MIN_ENGAGEMENT_SECONDS = 60; // minimum-engagement floor before submit
export const ACTIVITY_IDLE_THRESHOLD_MS = 60_000; // no interaction this long → idle

export function secondsToHours(seconds: number): number {
  return seconds / 3600;
}
