// components/scan-history/useReverseGeocode.js

import {
  fetchPlaceNameFromExpo,
  fetchPlaceNameFromOSM,
  geocodeCache,
  getCacheKey,
} from "@/utils/geocoding.utils";
import { useEffect, useState } from "react";

export function useReverseGeocode(latitude, longitude, shouldFetch) {
  const [placeName, setPlaceName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    if (!shouldFetch || latitude == null || longitude == null) return;

    const cacheKey = getCacheKey(latitude, longitude);

    if (geocodeCache.has(cacheKey)) {
      setPlaceName(geocodeCache.get(cacheKey));
      return;
    }

    let cancelled = false;

    async function fetchPlaceName() {
      try {
        setLoading(true);
        setError(null);
        setUsingFallback(false);

        let result = await fetchPlaceNameFromExpo(latitude, longitude);

        if (!result && !cancelled) {
          setUsingFallback(true);
          result = await fetchPlaceNameFromOSM(latitude, longitude);
        }

        if (cancelled) return;

        const finalPlaceName =
          result || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        geocodeCache.set(cacheKey, finalPlaceName);
        setPlaceName(finalPlaceName);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setPlaceName(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPlaceName();
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, shouldFetch]);

  return { placeName, loading, error, usingFallback };
}
