import React, { useEffect, useState } from "react";

export default function RealtimeAQICard({ city = "Delhi" }) {
  const [data, setData] = useState(null);

  const fetchAQI = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/current_aqi?city=${city}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching current AQI:", err);
    }
  };

  useEffect(() => {
    fetchAQI();
    const interval = setInterval(fetchAQI, 30000); // auto-refresh every 30 sec
    return () => clearInterval(interval);
  }, [city]);

  const aqi = data?.pm25 ?? "--";
  const category = data?.category ?? "Loading...";
  const datetime = data?.datetime ? new Date(data.datetime).toLocaleString() : "--";

  return (
    <div
      className="
        bg-white dark:bg-[var(--card)]
        text-primary border border-gray-300 dark:border-gray-700
        p-6 rounded-3xl shadow-md transition
      "
    >
      <h2 className="text-lg font-semibold text-primary mb-2">
        Live Air Quality
      </h2>

      <div className="mt-3">
        <div className="text-5xl font-bold text-indigo-700 dark:text-indigo-600">
          {aqi}
        </div>

        <div
          className="
            mt-2 inline-block px-4 py-1 rounded-full text-sm
            bg-gray-200 dark:bg-white/10
            text-primary
          "
        >
          {category}
        </div>
      </div>

      <p className="mt-4 text-sm text-secondary">
        Updated: {datetime}
      </p>
    </div>
  );
}
