// Shared geospatial helpers (great-circle distance).
//
// Canonical home for haversine math. Both the meters and miles variants use the
// same formula; they differ only in the Earth-radius constant (and therefore
// unit). Callers that need integer meters should round the result themselves.

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 6_371_000;
const EARTH_RADIUS_MI = 3958.8;

function haversine(a: LatLng, b: LatLng, radius: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Great-circle distance in meters (raw float; round at the call site if needed). */
export function haversineMeters(a: LatLng, b: LatLng): number {
  return haversine(a, b, EARTH_RADIUS_M);
}

/** Great-circle distance in miles. */
export function haversineMiles(a: LatLng, b: LatLng): number {
  return haversine(a, b, EARTH_RADIUS_MI);
}
