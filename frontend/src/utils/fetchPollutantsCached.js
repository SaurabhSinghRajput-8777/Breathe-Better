// src/utils/fetchPollutantsCached.js

export async function fetchPollutantsCached(city, fetchFn) {
  // Pollutants don't change rapidly, so 30 minutes cache is safe & efficient
  const CACHE_DURATION = 30 * 60 * 1000; 
  const CACHE_VERSION = "v1"; 
  const key = `${CACHE_VERSION}_pollutants_cache_${city.toLowerCase()}`;

  const cached = localStorage.getItem(key);

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const now = Date.now();
      const age = now - parsed.timestamp;

      // Check if cache is valid and not expired
      if (age < CACHE_DURATION && parsed.data) {
        console.log(`[Pollutants Cache] HIT for ${city}. Returning cached data.`);
        return parsed.data; 
      }
      
      console.log(`[Pollutants Cache] Expired for ${city}. Fetching new data...`);
    } catch (e) {
      console.warn("Error parsing pollutant cache, fetching fresh data:", e);
    }
  }

  console.log(`[Pollutants Cache] MISS for ${city}. Fetching from API...`);
  
  try {
    const fresh = await fetchFn();

    // Only cache if we got valid data (check for a known field like 'co' or 'no2')
    if (fresh && (fresh.co !== undefined || fresh.no2 !== undefined)) {
      localStorage.setItem(
        key,
        JSON.stringify({
          timestamp: Date.now(),
          data: fresh,
        })
      );
      console.log(`[Pollutants Cache] Set new cache for ${city}.`);
    }

    return fresh;
  } catch (error) {
    console.error(`[Pollutants Cache] API Fetch failed for ${city}:`, error);
    throw error;
  }
}