// src/pages/Home.jsx
import React, { useEffect, useState, useContext } from "react";
import Heatmap from "../components/Heatmap";
import MainPredictionCard from "../components/MainPredictionCard";
import RealtimeAQICard from "../components/RealtimeAQICard";
import PollutantCard from "../components/PollutantCard";
import ForecastCard from "../components/ForecastCard";
import HealthRecommendationCard from "../components/HealthRecommendationCard"; // 🔥 IMPORT NEW CARD
import { ThemeContext } from "../context/ThemeContext";
import { getCurrentAQI, getLivePollutants, getPredict } from "../lib/api";
import { fetchPredictionsCached } from "../utils/fetchPredictionsCached";
import { fetchPollutantsCached } from "../utils/fetchPollutantsCached";

export default function Home() {
  const { city } = useContext(ThemeContext);

  const [currentAqi, setCurrentAqi] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [pollutantsData, setPollutantsData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [pollutantsLoading, setPollutantsLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setPollutantsLoading(true);

    (async () => {
      let predictions = null;
      try {
        predictions = await fetchPredictionsCached(city, () => getPredict(city, 24));
      } catch (err) {
        console.warn("Predictions backend offline → using last known data");
        predictions = predictionData;
      }
      setPredictionData(predictions);
      setLoading(false);
    })();

    (async () => {
      let aqiData = null;
      try {
        aqiData = await getCurrentAQI(city);
      } catch (err) {
        console.warn("Live AQI backend offline → showing last known value");
        aqiData = currentAqi;
      }
      setCurrentAqi(aqiData);
    })();

    // 3. Fetch Live Pollutants (Now Cached!)
    (async () => {
      let pollData = null;
      try {
        // Wrap the API call in our new caching function
        pollData = await fetchPollutantsCached(city, () => getLivePollutants(city));
      } catch (err) {
        console.warn("Pollutants backend offline:", err);
        pollData = pollutantsData; // Fallback to existing state if failed
      }
      setPollutantsData(pollData);
      setPollutantsLoading(false);
    })();

    const interval = setInterval(() => {
      getCurrentAQI(city)
        .then((aqi) => setCurrentAqi(aqi))
        .catch(() => {});
    }, 1800000);

    return () => clearInterval(interval);

  }, [city]);

  const pollutants = [
    ["PM2.5", currentAqi?.pm25, "µg/m³"], 
    ["PM10", pollutantsData?.pm10, "µg/m³"],
    ["NO2", pollutantsData?.no2, "ppb"],
    ["SO2", pollutantsData?.so2, "ppb"],
    ["O3", pollutantsData?.o3, "ppb"],
    ["CO", pollutantsData?.co, "ppb"],
  ];

  return (
    <div className="min-h-screen bg-[--bg] transition-colors">

      <Heatmap />

      <MainPredictionCard
        liveAqiData={currentAqi}
        predData={predictionData}
        loading={loading}
      />

      <div className="max-w-[1200px] mx-auto mt-6 px-4 md:px-6">
        {/* 🔥 FIX: Changed items-start to items-stretch so columns have equal height */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

          <RealtimeAQICard city={city} />

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pollutants.map(([name, val, unit]) => (
              <PollutantCard
                key={name}
                name={name}
                value={val}
                unit={unit}
                loading={name === "PM2.5" ? loading : pollutantsLoading}
              />
            ))}
          </div>

        </div>
      </div>

      {/* 🔥 NEW: Health Recommendations Added Here */}
      <HealthRecommendationCard pm25={currentAqi?.pm25} />

      <ForecastCard city={city} hours={24} />

    </div>
  );
}