// src/components/RealtimeAQICard.jsx
import React, { useEffect, useState } from "react";
import { getCurrentAQI } from "../lib/api";

export default function RealtimeAQICard({ city = "Delhi" }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getCurrentAQI(city)
      .then((res) => {
        if (!mounted) return;
        setData(res);
      })
      .catch((e) => {
        console.error("current_aqi error", e);
        setErr(e.message || String(e));
      })
      .finally(() => setLoading(false));
    return () => (mounted = false);
  }, [city]);

  return (
    <div
      className="
        bg-(--card) p-6 rounded-3xl shadow-md
        border border-gray-300 dark:border-gray-700
        transition-colors
      "
    >
      {loading ? (
        <p className="text-secondary">Loading...</p>
      ) : err ? (
        <p className="text-red-500">Error: {err}</p>
      ) : !data ? (
        <p className="text-secondary">No data</p>
      ) : (
        <>
          <p className="text-secondary">Live AQI</p>
          <h1 className="text-4xl font-bold text-indigo-600 mt-2">
            {Math.round(convertPm25ToAQI(data.pm25) || 0)}
          </h1>
          <p className="text-secondary mt-1">{data.category} • {data.city}</p>

          <div className="mt-3 w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
            <div className="h-2 bg-indigo-600 w-[60%] rounded-full" />
          </div>

          <p className="mt-3 text-xs text-secondary">{new Date(data.datetime).toLocaleString()}</p>
        </>
      )}
    </div>
  );
}

// Simple placeholder conversion (backend ideally returns AQI elsewhere)
function convertPm25ToAQI(pm25) {
  // If backend already returns an AQI number, you can use that directly
  // For now, a rough scaling: this is NOT regulatory — replace with your own logic if available
  if (pm25 == null) return null;
  return Math.round(pm25 * 2); // placeholder
}
