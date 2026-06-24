/**
 * Per-jurisdiction certification pre-clearance gating.
 *
 * Originally per-county and CA-only (Change 8). Broadened once Tended grew
 * multi-state form generators: the work-cert PDF endpoint now gates on the
 * recipient's `users.state`. It opens only if DEMO_MODE is on or a county in
 * the state has an explicit clearance record. Rendering an official form is
 * not evidence that a local agency accepts a certificate from Tended.
 */
import { getDb } from "./cf";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const CITY_TO_COUNTY: Record<string, string> = {
  Sacramento: "county_sacramento",
  "Los Angeles": "county_losangeles",
  Fresno: "county_fresno",
};

export interface County {
  id: string;
  name: string;
  state: string;
  cert_enabled: number;
  cleared_at: number | null;
  clearance_note: string | null;
}

export function countyIdForCity(city: string | null | undefined): string | null {
  return city ? CITY_TO_COUNTY[city] ?? null : null;
}

export async function getCountyForCity(city: string | null | undefined): Promise<County | null> {
  const id = countyIdForCity(city);
  if (!id) return null;
  return (await getDb().prepare("SELECT * FROM counties WHERE id = ?").bind(id).first<County>()) ?? null;
}

export async function isCertEnabledForCity(city: string | null | undefined): Promise<boolean> {
  const county = await getCountyForCity(city);
  return !!county && county.cert_enabled === 1;
}

/** State-level pre-clearance check used by the work-cert PDF endpoint. */
export async function isCertEnabledForState(
  state: string | null | undefined
): Promise<boolean> {
  if (!state) return false;
  const code = state.toUpperCase();

  // (a) Demo-mode short-circuit — pilots ship before any real pre-clearance.
  try {
    const env = (getCloudflareContext().env as { DEMO_MODE?: string } | undefined) ?? undefined;
    if (env?.DEMO_MODE === "1" || env?.DEMO_MODE === "true") return true;
  } catch {
    /* outside a Cloudflare request — fine, fall through to DB checks */
  }

  // (b) At least one cleared county within the state.
  const cleared = await getDb()
    .prepare("SELECT 1 AS yes FROM counties WHERE state = ? AND cert_enabled = 1 LIMIT 1")
    .bind(code)
    .first<{ yes: number }>();
  if (cleared) return true;

  return false;
}
