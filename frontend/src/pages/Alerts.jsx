import React from "react";

export default function Alerts() {
  const alerts = [
    {
      id: 1,
      level: "High Pollution Alert",
      description: "PM2.5 levels have crossed hazardous levels in several areas.",
      time: "2 hours ago",
      color: "bg-red-500",
    },
    {
      id: 2,
      level: "Moderate AQI Warning",
      description: "Sensitive groups should avoid outdoor exercise.",
      time: "5 hours ago",
      color: "bg-yellow-500",
    },
    {
      id: 3,
      level: "Weather Impact Alert",
      description: "Wind inversion is worsening air stagnation today.",
      time: "1 day ago",
      color: "bg-blue-500",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-primary mb-6">Air Quality Alerts</h1>

      <div className="space-y-4">
        {alerts.map((a) => (
          <div
            key={a.id}
            className="
              p-5 rounded-xl shadow-md border
              bg-[var(--card)] text-primary
              border-gray-300 dark:border-gray-700
              transition
            "
          >
            <div className="flex items-center gap-3 mb-2">
              <span className={`w-3 h-3 rounded-full ${a.color}`}></span>
              <h2 className="font-semibold text-lg">{a.level}</h2>
            </div>

            <p className="text-secondary">{a.description}</p>
            <p className="text-xs text-secondary mt-2">{a.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
