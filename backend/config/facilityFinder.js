// ── Doctor / Facility Finder (OpenStreetMap) ────────────────────────────────
// Uses two free, card-free OSM services:
//   - Nominatim: turns a saved text address into coordinates when the
//     frontend doesn't have a live GPS fix.
//   - Overpass: the actual nearby-facility query.

const axios = require('axios');

const USER_AGENT = "HealthBot-MCA-Project/1.0 (contact: murtazabadam@gmail.com)";
const SEARCH_RADIUS_METERS = 15000; 

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
      timeout: 15000 
    });
    const data = res.data;
    if (!data || !data.length) return null;
    return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
  } catch (err) {
    console.error("Geocode error:", err.message);
    return null;
  }
}

async function findNearbyFacilities(latitude, longitude) {
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
        timeout: 25000
      }
    );
    
    const data = res.data;
    if (!data || !data.elements) return [];

    const seen = new Set();
    const facilities = [];

    for (const el of data.elements) {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (lat == null || lon == null) continue;

      const tags = el.tags || {};
      const name = tags.name || null;
      
      let type = "Health Facility";
      if (tags.amenity === "hospital" || tags.healthcare === "hospital") type = "Hospital";
      else if (tags.amenity === "clinic" || tags.healthcare === "clinic" || tags.healthcare === "centre") type = "Clinic";
      else if (tags.amenity === "doctors" || tags.healthcare === "doctor") type = "Doctor";
      else if (tags.amenity === "pharmacy" || tags.healthcare === "pharmacy") type = "Pharmacy";

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
    return facilities.slice(0, 20);
  } catch (err) {
    console.error("Overpass fetch error:", err.message);
    return [];
  }
}

module.exports = { geocodeAddress, findNearbyFacilities };