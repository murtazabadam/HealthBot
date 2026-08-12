// ── Doctor / Facility Finder (OpenStreetMap) ────────────────────────────────
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
    const res = await axios.get(url, { headers: { "User-Agent": USER_AGENT } });
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

      // Extract specialty from OSM tags
      const specialtyRaw = tags["healthcare:speciality"] || tags["medical_specialty"] || tags["speciality"] || null;
      const specialty = specialtyRaw ? specialtyRaw.replace(/_/g, " ") : null;

      const dedupeKey = `${name || "unnamed"}_${lat.toFixed(4)}_${lon.toFixed(4)}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      facilities.push({
        name: name || `${type} (unnamed)`,
        type,
        specialty,
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
    
    // Increased to 250 so Doctors and Pharmacies don't get choked out by clinics
    return facilities.slice(0, 250); 
  } catch (err) {
    console.error("Overpass fetch error:", err.message);
    return [];
  }
}

module.exports = { geocodeAddress, findNearbyFacilities };