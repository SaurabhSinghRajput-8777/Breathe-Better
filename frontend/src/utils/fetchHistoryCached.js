// src/utils/fetchHistoryCached.js

export async function fetchHistoryCached(city, days, fetchFn) {
  // Cache key includes city AND days (since 7 days vs 30 days are different requests)
  const key = `history_cache_v1_${city.toLowerCase()}_${days}`;
  
  // Cache duration: 1 Hour (Since history doesn't change rapidly within the same day)
  const CACHE_DURATION = 60 * 60 * 1000; 

  const cached = localStorage.getItem(key);
  
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;

      if (age < CACHE_DURATION && parsed.data) {
        console.log(`[Cache] Returning cached history for ${city} (${days} days)`);
        return parsed.data;
      }
    } catch (e) {
      console.warn("Error parsing history cache:", e);
    }
  }

  console.log(`[Cache] Fetching fresh history for ${city}...`);
  
  try {
    const fresh = await fetchFn();
    if (fresh) {
      localStorage.setItem(
        key,
        JSON.stringify({
          timestamp: Date.now(),
          data: fresh,
        })
      );
    }
    return fresh;
  } catch (error) {
    console.error(`[Cache] History fetch failed for ${city}:`, error);
    throw error;
  }
}