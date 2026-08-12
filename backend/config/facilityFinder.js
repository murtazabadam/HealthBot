// ── Doctor / Facility Finder (OpenStreetMap) ────────────────────────────────
// Uses two free, card-free OSM services:
//   - Nominatim: turns a saved text address into coordinates when the
//     frontend doesn't have a live GPS fix.
//   - Overpass: the actual nearby-facility query, using both the older
//     amenity=hospital/clinic/doctors tagging AND the newer healthcare=*
//     scheme — testing during development found several real private
//     clinics and individual doctors were tagged with healthcare=* only,
//     and would have been silently missing with amenity alone.
//
// Both services require a descriptive User-Agent identifying the app per
// their usage policies — this is a hard requirement, not a nicety; requests
// without one are the kind of traffic these services block.
//
// IMPORTANT: previous versions of this file silently returned an empty
// array on ANY failure (bad HTTP status, network error, timeout) — which
// is indistinguishable from a genuine "nothing nearby" result and made
// real failures invisible in both the UI and the logs. This version
// throws on failure instead, tries multiple public Overpass mirrors
// before giving up (a single public instance can be temporarily
// overloaded or rate-limiting a given server's IP), and logs exactly
// what happened at each step so Render's logs show the real cause.

const USER_AGENT = "HealthBot-MCA-Project/1.0 (contact: murtazabadam@gmail.com)";
const SEARCH_RADIUS_METERS = 15000; // matches the coverage check done during development
const REQUEST_TIMEOUT_MS = 20000;

// Tried in order; first one that responds successfully wins. All three are
// free, public Overpass instances — no API key or account needed for any.
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function geocodeAddress(address) {
  if (!address) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`;
    const res = await fetchWithTimeout(
      url,
      { headers: { "User-Agent": USER_AGENT } },
      REQUEST_TIMEOUT_MS,
    );
    if (!res.ok) {
      console.error(`Geocode failed: HTTP ${res.status} for address "${address}"`);
      return null;
    }
    const data = await res.json();
    if (!data || !data.length) {
      console.error(`Geocode returned no results for address "${address}"`);
      return null;
    }
    return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
  } catch (err) {
    console.error(`Geocode error for address "${address}":`, err.message);
    return null;
  }
}

function buildOverpassQuery(latitude, longitude) {
  return `[out:json][timeout:25];
(
  nwr["amenity"="hospital"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
  nwr["amenity"="clinic"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
  nwr["amenity"="doctors"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
  nwr["amenity"="pharmacy"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
  nwr["healthcare"="hospital"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
  nwr["healthcare"="clinic"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
  nwr["healthcare"="centre"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
  nwr["healthcare"="doctor"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
  nwr["healthcare"="pharmacy"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
);
out center tags;`;
}

function parseOverpassResponse(data, latitude, longitude) {
  const seen = new Set();
  const facilities = [];

  for (const el of data.elements || []) {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (lat == null || lon == null) continue;

    const tags = el.tags || {};
    const name = tags.name || null;
    const type = tags.amenity === "hospital" ? "Hospital"
      : tags.amenity === "clinic" ? "Clinic"
      : tags.amenity === "doctors" ? "Doctor"
      : tags.amenity === "pharmacy" ? "Pharmacy"
      : tags.healthcare === "hospital" ? "Hospital"
      : tags.healthcare === "clinic" ? "Clinic"
      : tags.healthcare === "centre" ? "Clinic"
      : tags.healthcare === "doctor" ? "Doctor"
      : tags.healthcare === "pharmacy" ? "Pharmacy"
      : "Health Facility";

    // Dedupe: the same physical place is sometimes tagged as both a node
    // and a way (building outline) — keep only one entry per name+location.
    const dedupeKey = `${name || "unnamed"}_${lat.toFixed(4)}_${lon.toFixed(4)}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    facilities.push({
      name: name || `${type} (unnamed)`,
      type,
      latitude: lat,
      longitude: lon,
      distanceKm: Math.round(haversineKm(latitude, longitude, lat, lon) * 10) / 10,
      phone: tags.phone || tags["contact:phone"] || null,
      address: tags["addr:full"] ||
        [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]]
          .filter(Boolean).join(", ") || null,
      mapsUrl: `https://www.google.com/maps?q=${lat},${lon}`,
    });
  }

  facilities.sort((a, b) => a.distanceKm - b.distanceKm);
  return facilities.slice(0, 15);
}

// Throws FacilityLookupError if every mirror fails, so the caller (and the
// user, via the API response) can tell "the search failed" apart from
// "the search worked and genuinely found nothing nearby".
class FacilityLookupError extends Error {}

async function findNearbyFacilities(latitude, longitude) {
  const query = buildOverpassQuery(latitude, longitude);
  const attempts = [];

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      console.log(`Overpass: trying ${endpoint}...`);
      const res = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: {
            "User-Agent": USER_AGENT,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "data=" + encodeURIComponent(query),
        },
        REQUEST_TIMEOUT_MS,
      );

      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        console.error(`Overpass ${endpoint} returned HTTP ${res.status}: ${bodyText.slice(0, 200)}`);
        attempts.push(`${endpoint}: HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      const facilities = parseOverpassResponse(data, latitude, longitude);
      console.log(`Overpass: ${endpoint} succeeded, ${facilities.length} facilities found`);
      return facilities; // success — even if facilities.length === 0, that's a
                          // genuine result from a working query, not a failure
    } catch (err) {
      const reason = err.name === "AbortError" ? "timed out" : err.message;
      console.error(`Overpass ${endpoint} failed: ${reason}`);
      attempts.push(`${endpoint}: ${reason}`);
    }
  }

  // Every mirror failed — this is a real failure, not "no results".
  throw new FacilityLookupError(
    `All Overpass endpoints failed. Attempts: ${attempts.join(" | ")}`,
  );
}

module.exports = { geocodeAddress, findNearbyFacilities, FacilityLookupError };