// ── Doctor / Facility Finder (OpenStreetMap) ────────────────────────────────
// Dynamically fetches real nearby hospitals and clinics based on GPS coordinates.
// Implements Multi-Server Routing: If the primary OSM server rate-limits the
// Render backend, it automatically retries on global mirror servers to ensure data loads.

const axios = require("axios");

const USER_AGENT =
  "HealthBot-MCA-Project/1.0 (contact: murtazabadam@gmail.com)";
const SEARCH_RADIUS_METERS = 30000; // 30km dynamic search radius

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
    const res = await axios.get(url, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 10000,
    });
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
  // 100% safe, explicit match query. Mirror servers block regex (~), so we explicitly define everything.
  const query = `[out:json][timeout:20];
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

  // List of global OSM Overpass mirror servers
  const endpoints = [
    "https://overpass-api.de/api/interpreter", // Primary (Germany)
    "https://lz4.overpass-api.de/api/interpreter", // Mirror 1
    "https://z.overpass-api.de/api/interpreter", // Mirror 2
    "https://overpass.kumi.systems/api/interpreter", // Mirror 3 (France - highly reliable)
  ];

  let data = null;

  // Try each server one by one until one succeeds
  for (const endpoint of endpoints) {
    try {
      console.log(`Trying OSM server: ${endpoint}...`);
      const res = await axios.post(
        endpoint,
        "data=" + encodeURIComponent(query),
        {
          headers: {
            "User-Agent": USER_AGENT,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 15000,
        },
      );

      if (res.data && res.data.elements) {
        data = res.data;
        console.log(`✅ Success fetching live data from ${endpoint}`);
        break; // Stop trying other servers once we have the data!
      }
    } catch (err) {
      console.log(
        `❌ Failed on ${endpoint}: ${err.message}. Trying next server...`,
      );
    }
  }

  // If ALL servers failed, throw a clean error to the frontend
  if (!data || !data.elements) {
    console.error("All OpenStreetMap servers timed out or rejected the query.");
    throw new Error(
      "Map servers are currently busy. Please try again in a moment.",
    );
  }

  const seen = new Set();
  const facilities = [];

  for (const el of data.elements) {
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

    if (!name || name.trim() === "") {
      name = `${type} (Unnamed Map Entry)`;
    }

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
  return facilities.slice(0, 15);
}

module.exports = { geocodeAddress, findNearbyFacilities };
