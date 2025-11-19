// src/utils/fetchPredictionsCached.js

export async function fetchPredictionsCached(city, fetchFn) {
  const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
  // 🔥 CHANGE 1: Add a version prefix. Changing this string invalidates all old caches.
  const CACHE_VERSION = "v2"; 
  const key = `${CACHE_VERSION}_pred_cache_${city.toLowerCase()}`;

  const cached = localStorage.getItem(key);
  
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const now = Date.now();
      const age = now - parsed.timestamp;

      console.log(`[Cache] Found cache for ${city}. Age: ${Math.round(age / 1000)}s`);

      // 🔥 CHANGE 2: Add a safety check. If the cached data is empty or invalid, ignore it.
      const isValidData = parsed.data && parsed.data.predictions && parsed.data.predictions.length > 0;

      if (age < CACHE_DURATION && isValidData) {
        console.log(`[Cache] CACHE HIT for ${city}. Returning cached data.`);
        return parsed.data; 
      }

      console.log(`[Cache] Cache expired or invalid for ${city}. Fetching new data.`);
    } catch (e) {
      console.warn("Error parsing cache, fetching fresh data:", e);
    }
  }

  console.log(`[Cache] CACHE MISS for ${city}. Fetching from API...`);
  
  try {
    const fresh = await fetchFn();

    // 🔥 CHANGE 3: Only cache if we actually got valid predictions back
    if (fresh && fresh.predictions && fresh.predictions.length > 0) {
      localStorage.setItem(
        key,
        JSON.stringify({
          timestamp: Date.now(),
          data: fresh,
        })
      );
      console.log(`[Cache] Set new cache for ${city}.`);
    }

    return fresh;
  } catch (error) {
    console.error(`[Cache] API Fetch failed for ${city}:`, error);
    throw error;
  }
}