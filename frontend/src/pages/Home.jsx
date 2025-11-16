// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import Heatmap from "../components/Heatmap";
import MainPredictionCard from "../components/MainPredictionCard";
import RealtimeAQICard from "../components/RealtimeAQICard";
import PollutantCard from "../components/PollutantCard";
import ForecastCard from "../components/ForecastCard";

export default function Home() {
  const [livePm25, setLivePm25] = useState(null);
  const [loading, setLoading] = useState(true);

  // --------------------------
  // Fetch LIVE PM2.5 (for PM2.5 pollutant card)
  // --------------------------
  const fetchLiveAQI = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/current_aqi?city=Delhi");
      const data = await res.json();

      if (data.pm25) {
        setLivePm25(data.pm25);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching live PM2.5:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveAQI();
    const interval = setInterval(fetchLiveAQI, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // --------------------------
  // POLLUTANT CARDS (PM2.5 real, others placeholders)
  // --------------------------
  const pollutants = [
    ["PM2.5", livePm25 ?? 0, "µg/m³"], // LIVE DATA
    ["PM10", 283, "µg/m³"],
    ["NO2", 40, "ppb"],
    ["SO2", 5, "ppb"],
    ["O3", 22, "ppb"],
    ["CO", 0.7, "ppm"],
  ];

  return (
    <div className="min-h-screen bg-(--bg) transition-colors">
      {/* MAP */}
      <Heatmap />

      {/* 24H PREDICTION CARD (will be wired later) */}
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

      {/* LIVE AQI + POLLUTANTS */}
      <div className="max-w-[1200px] mx-auto mt-6 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* LIVE AQI */}
          <RealtimeAQICard />

          {/* POLLUTANTS */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pollutants.map(([name, val, unit]) => (
              <PollutantCard 
                key={name} 
                name={name} 
                value={val} 
                unit={unit} 
                trend="up" 
                loading={loading}
              />
            ))}
          </div>

        </div>
      </div>

      {/* FORECAST GRAPH CARD */}
      <ForecastCard city="Delhi" hours={24} />
    </div>
  );
}
