// components/scan-history/geocoding.utils.js

// Dynamically import expo-location
let Location;
try {
  Location = require("expo-location");
} catch (error) {
  console.warn("[scan-history] expo-location not available:", error.message);
  Location = null;
}

export const geocodeCache = new Map();

export function getCacheKey(latitude, longitude) {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

export async function fetchPlaceNameFromOSM(latitude, longitude) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "RESQID/1.0",
        "Accept-Language": "en",
      },
    });

    if (!response.ok) throw new Error("OSM API failed");

    const data = await response.json();
    return data?.display_name || null;
  } catch (error) {
    console.warn("[OSM Geocoding] Failed:", error.message);
    return null;
  }
}

export async function fetchPlaceNameFromExpo(latitude, longitude) {
  if (!Location || !Location.reverseGeocodeAsync) return null;

  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!results || results.length === 0) return null;

    const parts = [
      results[0].street,
      results[0].district,
      results[0].city || results[0].subregion,
      results[0].region,
      results[0].country,
    ].filter(Boolean);

    return parts.join(", ");
  } catch (locError) {
    console.warn("[Expo Location] Failed:", locError.message);
    return null;
  }
}
