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

const axios = require("axios");

const USER_AGENT =
  "HealthBot-MCA-Project/1.0 (contact: murtazabadam@gmail.com)";
const SEARCH_RADIUS_METERS = 40000; // 40KM radius for robust demo coverage

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

async function geocodeAddress(address) {
  if (!address) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`;
    const res = await axios.get(url, { headers: { "User-Agent": USER_AGENT } });
    const data = res.data;
    if (!data || !data.length) return null;
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  } catch (err) {
    console.error("Geocode error:", err.message);
    return null;
  }
}

async function findNearbyFacilities(latitude, longitude) {
  // THE FIX: Reverted to exact matches. OSM Overpass crashes silently on (?i) regex.
  const query = `[out:json][timeout:25];
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

  try {
    const res = await axios.post(
      "https://overpass-api.de/api/interpreter",
      "data=" + encodeURIComponent(query),
      {
        headers: {
          "User-Agent": USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 15000,
      },
    );

    const data = res.data;
    const seen = new Set();
    const facilities = [];

    for (const el of data.elements || []) {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (lat == null || lon == null) continue;

      const tags = el.tags || {};
      let name = tags.name || tags["name:en"] || null;

      let type = "Health Facility";
      const am = (tags.amenity || "").toLowerCase();
      const hc = (tags.healthcare || "").toLowerCase();

      if (am === "hospital" || hc === "hospital") type = "Hospital";
      else if (am === "clinic" || hc === "clinic" || hc === "centre")
        type = "Clinic";
      else if (am === "doctors" || hc === "doctor") type = "Doctor";
      else if (am === "pharmacy" || hc === "pharmacy") type = "Pharmacy";

      // THE FIX: Do not hide unnamed facilities! Many places in J&K lack a formal name tag.
      if (!name || name.trim() === "") {
        name = `${type} (Unnamed Map Entry)`;
      }

      // Dedupe: the same physical place is sometimes tagged as both a node
      // and a way (building outline) — keep only one entry per name+location.
      const dedupeKey = `${name}_${lat.toFixed(4)}_${lon.toFixed(4)}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      facilities.push({
        name: name,
        type,
        latitude: lat,
        longitude: lon,
        distanceKm:
          Math.round(haversineKm(latitude, longitude, lat, lon) * 10) / 10,
        phone: tags.phone || tags["contact:phone"] || null,
        address:
          tags["addr:full"] ||
          [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]]
            .filter(Boolean)
            .join(", ") ||
          null,
        mapsUrl: `https://www.google.com/maps?q=${lat},${lon}`,
      });
    }

    facilities.sort((a, b) => a.distanceKm - b.distanceKm);
    return facilities.slice(0, 20); // Returning top 20
  } catch (err) {
    console.error("Overpass fetch error:", err.message);
    return [];
  }
}

module.exports = { geocodeAddress, findNearbyFacilities };
