import React from "react";

export default function PollutantCard({ name, value, unit = "µg/m³", trend = "up" }) {
  const colors = {
    PM2_5: "bg-rose-500",
    PM10: "bg-orange-500",
    NO2: "bg-yellow-400",
    SO2: "bg-indigo-500",
    O3: "bg-cyan-400",
    CO: "bg-green-400",
    default: "bg-slate-400",
  };

  const key = name.replace(".", "_").replace(/\s+/g, "");
  const badgeColor = colors[key] || colors.default;

  return (
    <div
      className="
        bg-(--card) rounded-xl p-4 shadow-md
        border border-gray-300 dark:border-gray-700
        transition-colors
      "

    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-secondary text-sm">{name}</div>

          <div className="text-2xl font-bold mt-1">
            {value}
            <span className="text-secondary text-sm">
              {" "}{unit}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className={`h-3 w-3 rounded-full ${badgeColor}`} />
          <div className="mt-2 text-xs text-secondary">
            {trend === "up" ? "▲" : "▼"}
          </div>
        </div>
      </div>
    </div>
  );
}
