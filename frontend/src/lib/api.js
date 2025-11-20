// src/lib/api.js
export const DEFAULT_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function fetchJson(path, opts = {}) {
  const res = await fetch(`${DEFAULT_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text();
    let err;
    try { err = JSON.parse(text); } catch (e) { err = text; }
    throw new Error(`API ${path} failed: ${res.status} ${res.statusText} — ${JSON.stringify(err)}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function getCurrentAQI(city = "Delhi") {
  return fetchJson(`/current_aqi?city=${encodeURIComponent(city)}`);
}

export async function getPredict(city = "Delhi", duration_hours = 24) {
  return fetchJson(`/predict?city=${encodeURIComponent(city)}&duration_hours=${duration_hours}`);
}

export async function getLivePollutants(city = "Delhi") {
  return fetchJson(`/live_pollutants?city=${encodeURIComponent(city)}`);
}

export async function getHistory(city = "Delhi", days = 7) {
  return fetchJson(`/history?city=${encodeURIComponent(city)}&days=${days}`);
}

export async function getWeeklyForecast(city = "Delhi") {
  return fetchJson(`/forecast/weekly?city=${encodeURIComponent(city)}`);
}

export async function getHeatmapGeoJSON(city = "Delhi", days = 1) {
  return fetchJson(`/heatmap?city=${encodeURIComponent(city)}&days=${days}`);
}

export async function trainModel(city = "Delhi", days = 30) {
  return fetchJson(`/train?city=${encodeURIComponent(city)}&days=${days}`);
}

export async function getModelMetrics(city = "Delhi") { 
  return fetchJson(`/metrics?city=${encodeURIComponent(city)}`);
}

// 🔥 CRITICAL FIX: Ensure 'days' is passed correctly to the URL
export async function downloadPdfReport(city = "Delhi", days = 7) {
  const url = `${DEFAULT_BASE}/report/pdf?city=${encodeURIComponent(city)}&days=${days}`;
  console.log(`Downloading Report from: ${url}`); // Debug log
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to download PDF");
  return res.blob();
}