// src/utils/fetchPredictionsCached.js
export async function fetchPredictionsCached(city, fetchFn) {
  const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
  const key = `pred_cache_${city.toLowerCase()}`;

  const cached = localStorage.getItem(key);
  if (cached) {
    const parsed = JSON.parse(cached);
    const now = Date.now();
    const age = now - parsed.timestamp;

    // ADDED-1: Log the cache status
    console.log(`[Cache] Found cache for ${city}. Age: ${Math.round(age / 1000)}s / ${CACHE_DURATION / 1000}s`);

    if (age < CACHE_DURATION) {
      // ADDED-2: Log a CACHE HIT
      console.log(`[Cache] CACHE HIT for ${city}. Returning cached data.`);
      return parsed.data; // Cached predictions returned instantly
    }

    // ADDED-3: Log an expired cache
    console.log(`[Cache] Cache expired for ${city}. Fetching new data.`);
  }

  // If no cache or expired → fetch fresh
  // ADDED-4: Log a CACHE MISS
  console.log(`[Cache] CACHE MISS for ${city}. Fetching from API...`);
  const fresh = await fetchFn();

  localStorage.setItem(
    key,
    JSON.stringify({
      timestamp: Date.now(),
      data: fresh,
    })
  );

  // ADDED-5: Log the new cache set
  console.log(`[Cache] Set new cache for ${city}.`);

  return fresh;
}