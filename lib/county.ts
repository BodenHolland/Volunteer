/**
 * Per-county certification pre-clearance (Change 8). Certification is disabled by
 * default in a county and only enabled after written CDSS/county confirmation is
 * recorded (`counties.cert_enabled`). The CF 888 path is gated on this.
 */
import { getDb } from "./cf";

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
