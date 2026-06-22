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

// Retail categories that plausibly sell the USDA Thrifty basket.
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
