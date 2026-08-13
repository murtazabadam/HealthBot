// ── Doctor / Facility Finder (Hybrid: OpenStreetMap + Google Places) ───────
// Two independent sources are queried in parallel and merged:
//   - OSM (free, card-free): Nominatim for saved-address geocoding, Overpass
//     for the nearby-facility query itself, using both the older
//     amenity=hospital/clinic/doctors tagging AND the newer healthcare=*
//     scheme — testing during development found several real private
//     clinics and individual doctors were tagged with healthcare=* only,
//     and would have been silently missing with amenity alone.
//   - Google Places Nearby Search: added because OSM coverage for
//     individual pharmacies and private doctors is thin in many areas
//     (including ours) — Google's business listings fill that gap.
//     Requires GOOGLE_PLACES_API_KEY (Places API enabled, billing set up
//     on the Google Cloud project — Google gives a recurring free monthly
//     credit that comfortably covers a capstone project's traffic).
//
// The two sources are merged and deduped (same physical place returned by
// both gets tagged source: "osm+google" instead of appearing twice).
//
// OSM's requests require a descriptive User-Agent identifying the app per
// its usage policy — this is a hard requirement, not a nicety; requests
// without one are the kind of traffic Nominatim/Overpass block.
//
// IMPORTANT: previous versions of this file silently returned an empty
// array on ANY failure (bad HTTP status, network error, timeout) — which
// is indistinguishable from a genuine "nothing nearby" result and made
// real failures invisible in both the UI and the logs. This version
// throws on failure instead, tries multiple public Overpass mirrors
// before giving up (a single public instance can be temporarily
// overloaded or rate-limiting a given server's IP), and logs exactly
// what happened at each step so Render's logs show the real cause.
// With two sources, a total failure now only happens if BOTH OSM and
// Google fail — one source being down no longer takes out the feature.
// "Google fails" here also covers "Google isn't configured yet" (no
// GOOGLE_PLACES_API_KEY) — an unconfigured source hasn't actually
// searched anything, so it can't count as a successful "found nothing".

const USER_AGENT = "HealthBot-MCA-Project/1.0 (contact: murtazabadam@gmail.com)";
const SEARCH_RADIUS_METERS = 15000; // matches the coverage check done during development
const REQUEST_TIMEOUT_MS = 20000;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Google Places "type" values used for the nearby search, mapped to the
// same category labels the OSM side and the frontend filters already use.
// Google doesn't have a dedicated "clinic" type — clinics are picked up
// under "hospital" or "doctor" depending on how the business is listed.
const GOOGLE_TYPE_LABELS = {
  hospital: "Hospital",
  pharmacy: "Pharmacy",
  doctor: "Doctor",
};

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

// ── OSM side (renamed from the old findNearbyFacilities) ───────────────────
async function findOsmFacilities(latitude, longitude) {
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
      const facilities = parseOverpassResponse(data, latitude, longitude).map((f) => ({
        ...f,
        source: "osm",
      }));
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

// ── Google Places side ──────────────────────────────────────────────────────
async function fetchGoogleType(type, latitude, longitude) {
  const url =
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
    `?location=${latitude},${longitude}&radius=${SEARCH_RADIUS_METERS}` +
    `&type=${type}&key=${GOOGLE_PLACES_API_KEY}`;

  const res = await fetchWithTimeout(url, {}, REQUEST_TIMEOUT_MS);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = await res.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`${data.status}${data.error_message ? " - " + data.error_message : ""}`);
  }

  return (data.results || [])
    .filter((place) => place.geometry?.location)
    .map((place) => {
      const lat = place.geometry.location.lat;
      const lon = place.geometry.location.lng;
      return {
        name: place.name || `${GOOGLE_TYPE_LABELS[type]} (unnamed)`,
        type: GOOGLE_TYPE_LABELS[type] || "Health Facility",
        latitude: lat,
        longitude: lon,
        distanceKm: Math.round(haversineKm(latitude, longitude, lat, lon) * 10) / 10,
        phone: null, // Nearby Search doesn't return phone; would need a
                     // separate Place Details call per result (extra cost)
        address: place.vicinity || null,
        rating: typeof place.rating === "number" ? place.rating : null,
        mapsUrl: place.place_id
          ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
          : `https://www.google.com/maps?q=${lat},${lon}`,
        source: "google",
      };
    });
}

// Queries all three place types in parallel. Never throws for "no key" or
// partial type failures — it just returns what it can, and the caller
// (findNearbyFacilities) decides whether the overall hybrid lookup failed.
async function findGoogleFacilities(latitude, longitude) {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("Google Places: GOOGLE_PLACES_API_KEY not set — skipping Google source");
    return [];
  }

  const types = Object.keys(GOOGLE_TYPE_LABELS);
  const settled = await Promise.allSettled(
    types.map((type) => fetchGoogleType(type, latitude, longitude)),
  );

  const facilities = [];
  let allFailed = true;
  const attempts = [];
  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      allFailed = false;
      facilities.push(...result.value);
    } else {
      const reason = result.reason?.name === "AbortError" ? "timed out" : result.reason?.message;
      console.error(`Google Places (${types[i]}) failed: ${reason}`);
      attempts.push(`${types[i]}: ${reason}`);
    }
  });

  if (allFailed) {
    throw new Error(`All Google Places type queries failed. Attempts: ${attempts.join(" | ")}`);
  }
  return facilities;
}

// ── Merge + dedupe ──────────────────────────────────────────────────────────
function normalizeName(name) {
  return (name || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

// Same physical place is often listed in both OSM and Google. Treat two
// entries as the same place if their names match (normalized) or they sit
// within ~80m of each other and share a category. When merged, keep the
// OSM entry (it usually has better address tagging) but fill in anything
// Google has that OSM is missing (phone, rating), and mark the source as
// "osm+google" so the UI can show that it's corroborated by both.
function mergeFacilitySources(osmFacilities, googleFacilities) {
  const merged = osmFacilities.map((f) => ({ ...f }));

  for (const gFac of googleFacilities) {
    const dupe = merged.find((f) => {
      const sameName =
        normalizeName(f.name) && normalizeName(f.name) === normalizeName(gFac.name);
      const closeBy =
        f.type === gFac.type &&
        haversineKm(f.latitude, f.longitude, gFac.latitude, gFac.longitude) < 0.08;
      return sameName || closeBy;
    });

    if (dupe) {
      dupe.phone = dupe.phone || gFac.phone;
      dupe.rating = dupe.rating ?? gFac.rating;
      dupe.mapsUrl = dupe.mapsUrl || gFac.mapsUrl;
      dupe.source = "osm+google";
    } else {
      merged.push(gFac);
    }
  }

  merged.sort((a, b) => a.distanceKm - b.distanceKm);
  return merged.slice(0, 20);
}

// ── Public hybrid entry point ───────────────────────────────────────────────
// Runs OSM and Google in parallel. Only throws FacilityLookupError if BOTH
// sources genuinely failed to produce a result — one source being down (or
// unconfigured, for Google) no longer takes out the whole feature the way a
// single-source failure used to.
//
// "Genuinely failed" deliberately treats an unconfigured Google source
// (no GOOGLE_PLACES_API_KEY) the same as a failed one for this check: it
// never actually searched anything, so if OSM also fails, there is no
// source with a real result — that must surface as a failure, not as a
// silent "found nothing nearby".
async function findNearbyFacilities(latitude, longitude) {
  const googleConfigured = Boolean(GOOGLE_PLACES_API_KEY);

  const [osmResult, googleResult] = await Promise.allSettled([
    findOsmFacilities(latitude, longitude),
    findGoogleFacilities(latitude, longitude),
  ]);

  const osmFacilities = osmResult.status === "fulfilled" ? osmResult.value : [];
  const googleFacilities = googleResult.status === "fulfilled" ? googleResult.value : [];

  if (osmResult.status === "rejected") {
    console.error("Facility lookup: OSM source failed:", osmResult.reason.message);
  }
  if (googleResult.status === "rejected") {
    console.error("Facility lookup: Google source failed:", googleResult.reason.message);
  }

  const osmFailed = osmResult.status === "rejected";
  const googleFailed = googleResult.status === "rejected" || !googleConfigured;

  if (osmFailed && googleFailed) {
    const osmMsg = osmResult.status === "rejected" ? osmResult.reason.message : "unknown error";
    const googleMsg = !googleConfigured
      ? "not configured (GOOGLE_PLACES_API_KEY unset)"
      : googleResult.reason.message;
    throw new FacilityLookupError(
      `Both facility sources failed. OSM: ${osmMsg} | Google: ${googleMsg}`,
    );
  }

  console.log(
    `Facility lookup: ${osmFacilities.length} from OSM, ${googleFacilities.length} from Google` +
      (googleConfigured ? "" : " (Google not configured)"),
  );
  return mergeFacilitySources(osmFacilities, googleFacilities);
}

module.exports = { geocodeAddress, findNearbyFacilities, FacilityLookupError };