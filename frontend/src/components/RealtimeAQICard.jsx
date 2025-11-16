import React from "react";

export default function RealtimeAQICard() {
  return (
    <div
      className="
        bg-(--card) p-6 rounded-3xl shadow-md
        border border-gray-300 dark:border-gray-700
        transition-colors
      "
    >
      <p className="text-secondary">Live AQI</p>

      <h1 className="text-4xl font-bold text-red-600 mt-2">291</h1>

      <p className="text-secondary mt-1">Severe</p>

      <div className="mt-3 w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-full">
        <div className="h-2 bg-red-500 w-[90%] rounded-full"></div>
      </div>

      <p className="text-xs text-secondary mt-3">Ghaziabad • Updated just now</p>
    </div>
  );
}
