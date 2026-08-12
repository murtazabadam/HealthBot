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
const SEARCH_RADIUS_METERS = 40000; // INCREASED TO 40KM: Guarantees results for the presentation demo!

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
  // Using Regex (~"(?i)...") casts a wider net to catch all possible medical facilities
  const query = `[out:json][timeout:25];
(
  nwr["amenity"~"(?i)(hospital|clinic|doctors|pharmacy)"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
  nwr["healthcare"~"(?i)(hospital|clinic|doctor|pharmacy|centre)"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
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
      const name = tags.name || null;

      // Filter out unnamed facilities so the demo looks highly professional
      if (!name || name.trim() === "") continue;

      let type = "Health Facility";
      const am = (tags.amenity || "").toLowerCase();
      const hc = (tags.healthcare || "").toLowerCase();

      if (am.includes("hospital") || hc.includes("hospital")) type = "Hospital";
      else if (
        am.includes("clinic") ||
        hc.includes("clinic") ||
        hc.includes("centre")
      )
        type = "Clinic";
      else if (am.includes("doctor") || hc.includes("doctor")) type = "Doctor";
      else if (am.includes("pharmacy") || hc.includes("pharmacy"))
        type = "Pharmacy";

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
    return facilities.slice(0, 20); // Returning top 20 for a robust demo list
  } catch (err) {
    console.error("Overpass fetch error:", err.message);
    return [];
  }
}

module.exports = { geocodeAddress, findNearbyFacilities };
