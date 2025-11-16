// src/pages/Home.jsx
import React from "react";
import Heatmap from "../components/Heatmap";
import MainPredictionCard from "../components/MainPredictionCard";
import RealtimeAQICard from "../components/RealtimeAQICard";
import PollutantCard from "../components/PollutantCard";
import ForecastCard from "../components/ForecastCard";

export default function Home() {
  const fakePollutants = [
    ["PM2.5", 207, "µg/m³"],
    ["PM10", 283, "µg/m³"],
    ["NO2", 40, "ppb"],
    ["SO2", 5, "ppb"],
    ["O3", 22, "ppb"],
    ["CO", 0.7, "ppm"],
  ];

  return (
    <div className="min-h-screen bg-(--bg) transition-colors">
      <Heatmap />

      <MainPredictionCard
        pred={{
          aqi: 145,
          category: "Unhealthy",
          pm25: 85,
          pm10: 130,
          time: "Tomorrow",
          weather: { temp: 21, icon: "🌫️" },
        }}
      />

      <div className="max-w-[1200px] mx-auto mt-6 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <RealtimeAQICard />

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fakePollutants.map(([name, val, unit]) => (
              <PollutantCard key={name} name={name} value={val} unit={unit} trend="up" />
            ))}
          </div>
        </div>
      </div>

      {/* Forecast chart card below */}
      <ForecastCard city="Delhi" hours={24} />
    </div>
  );
}
