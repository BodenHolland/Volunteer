/**
 * Nearby-store discovery for the food-price audit flow.
 *
 * Two sources are merged:
 *  - stores already in our D1 `stores` table (fast, always available)
 *  - live points-of-interest from OpenStreetMap via the Overpass API
 *    (free, keyless) so a volunteer standing in a brand-new neighborhood
 *    still sees the groceries physically around them.
 *
 * The OSM call is best-effort: any failure (timeout, rate limit, network)
 * degrades gracefully to "DB stores only", and the volunteer can always fall
 * back to manual entry.
 */

export interface NearbyStore {
  source: "db" | "osm";
  /** Set when this is an existing D1 store row. */
  store_id: string | null;
  /** External reference, e.g. "osm:node/12345" — used to dedupe + reuse. */
  place_id: string | null;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance_m: number;
}

const EARTH_RADIUS_M = 6_371_000;

export function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h))));
}

// Retail categories that plausibly sell the basket.
const FOOD_SHOP_TYPES = [
  "supermarket",
  "grocery",
  "convenience",
  "greengrocer",
  "general",
  "department_store",
  "wholesale",
  "health_food",
];

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function buildAddress(tags: Record<string, string>): string {
  const line1 = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const cityState = [tags["addr:city"], tags["addr:state"]].filter(Boolean).join(", ");
  return [line1, cityState, tags["addr:postcode"]].filter(Boolean).join(", ").trim();
}

/** Query OpenStreetMap for food retailers within `radiusM` of a point. */
export async function fetchOsmNearby(
  lat: number,
  lng: number,
  radiusM = 2000,
  limit = 30
): Promise<NearbyStore[]> {
  const filter = FOOD_SHOP_TYPES.join("|");
  const q = `[out:json][timeout:15];
(
  node["shop"~"^(${filter})$"](around:${radiusM},${lat},${lng});
  way["shop"~"^(${filter})$"](around:${radiusM},${lat},${lng});
);
out center ${limit};`;

  let json: { elements?: OverpassElement[] };
  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Tended/1.0 (civic food-price audit)",
      },
      body: `data=${encodeURIComponent(q)}`,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    json = (await res.json()) as { elements?: OverpassElement[] };
  } catch {
    return [];
  }

  const out: NearbyStore[] = [];
  for (const el of json.elements ?? []) {
    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    const tags = el.tags ?? {};
    const name = tags.name?.trim();
    if (elLat == null || elLng == null || !name) continue;
    out.push({
      source: "osm",
      store_id: null,
      place_id: `osm:${el.type}/${el.id}`,
      name,
      address: buildAddress(tags) || `Near ${elLat.toFixed(4)}, ${elLng.toFixed(4)}`,
      lat: elLat,
      lng: elLng,
      distance_m: haversineMeters(lat, lng, elLat, elLng),
    });
  }
  return out;
}

/**
 * Geocode a single free-text address to lat/lng via Nominatim. Used when a
 * volunteer saves their home address — we stash the coordinates inside the
 * (encrypted) address_json so we can later compute commute distance to audit
 * stores without re-geocoding. Returns null on miss / failure.
 */
export async function nominatimGeocode(
  addressText: string
): Promise<{ lat: number; lng: number } | null> {
  const q = addressText.trim();
  if (q.length < 5) return null;
  const params = new URLSearchParams({
    q,
    format: "json",
    limit: "1",
    countrycodes: "us",
  });
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        "User-Agent": "Tended/1.0 (civic food-price audit; hello@tended.org)",
        "Accept-Language": "en",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{ lat: string; lon: string }>;
    const hit = json[0];
    if (!hit) return null;
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

/**
 * Compute the driving route between two points via the OSRM public router
 * (`router.project-osrm.org`) — free, no key, intended for small projects.
 * Returns distance (meters) and duration (seconds), or null on failure.
 * Caller is responsible for doubling for round trip.
 */
export async function osrmRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<{ distanceMeters: number; durationSeconds: number } | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false&alternatives=false&steps=false`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Tended/1.0 (civic food-price audit)" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      code?: string;
      routes?: Array<{ distance: number; duration: number }>;
    };
    const route = json.routes?.[0];
    if (!route || json.code !== "Ok") return null;
    return { distanceMeters: route.distance, durationSeconds: route.duration };
  } catch {
    return null;
  }
}

interface NominatimResult {
  osm_type?: "node" | "way" | "relation";
  osm_id?: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  class?: string;
  type?: string;
  address?: Record<string, string>;
}

/**
 * Free-text store search via OpenStreetMap Nominatim. Used when the volunteer
 * types a name/address instead of clicking "Use my location". US-scoped so we
 * never return Buenos Aires for "Safeway". If a device location is provided we
 * bias ranking toward results near them.
 *
 * Nominatim usage policy: ≤1 req/sec, identifying User-Agent, no bulk loops.
 * That's a fit for human-driven typing (debounced 200ms in the UI).
 */
export async function nominatimSearch(
  query: string,
  hint?: { lat: number; lng: number },
  limit = 10
): Promise<NearbyStore[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    q,
    format: "json",
    addressdetails: "1",
    countrycodes: "us",
    limit: String(limit),
  });
  if (hint) {
    // ~30km bbox around the hint for proximity bias (bounded=0 = hint only).
    const dLat = 0.27;
    const dLng = 0.27;
    params.set(
      "viewbox",
      `${hint.lng - dLng},${hint.lat + dLat},${hint.lng + dLng},${hint.lat - dLat}`
    );
    params.set("bounded", "0");
  }

  let json: NominatimResult[];
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        "User-Agent": "Tended/1.0 (civic food-price audit; hello@tended.org)",
        "Accept-Language": "en",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return [];
    json = (await res.json()) as NominatimResult[];
  } catch {
    return [];
  }

  const out: NearbyStore[] = [];
  for (const r of json) {
    const lat = Number(r.lat);
    const lng = Number(r.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const a = r.address ?? {};
    const line1 = [a["house_number"], a["road"]].filter(Boolean).join(" ");
    const cityState = [a["city"] ?? a["town"] ?? a["village"], a["state"]].filter(Boolean).join(", ");
    const address =
      [line1, cityState, a["postcode"]].filter(Boolean).join(", ").trim() || r.display_name;
    const name = r.name?.trim() || r.display_name.split(",")[0]!.trim();
    const placeId = r.osm_type && r.osm_id ? `osm:${r.osm_type}/${r.osm_id}` : null;
    out.push({
      source: "osm",
      store_id: null,
      place_id: placeId,
      name,
      address,
      lat,
      lng,
      distance_m: hint ? haversineMeters(hint.lat, hint.lng, lat, lng) : 0,
    });
  }
  return out;
}
