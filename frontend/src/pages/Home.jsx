// src/pages/Home.jsx
import React, { useEffect, useState, useContext } from "react";
import Heatmap from "../components/Heatmap";
import MainPredictionCard from "../components/MainPredictionCard";
import RealtimeAQICard from "../components/RealtimeAQICard";
import PollutantCard from "../components/PollutantCard";
import ForecastCard from "../components/ForecastCard";
import { ThemeContext } from "../context/ThemeContext";
import { getCurrentAQI, getLivePollutants, getPredict } from "../lib/api";

// Cache utilities
import { fetchPredictionsCached } from "../utils/fetchPredictionsCached";

export default function Home() {
  const { city } = useContext(ThemeContext);

  const [currentAqi, setCurrentAqi] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [pollutantsData, setPollutantsData] = useState(null);

  // These two loading states are now TRULY independent
  const [loading, setLoading] = useState(true);
  const [pollutantsLoading, setPollutantsLoading] = useState(true);

  useEffect(() => {
    // Set both loaders to true at the very start
    setLoading(true);
    setPollutantsLoading(true);

    // --- 1. PREDICTION FETCH (CONTROLS MAIN LOADER) ---
    // This is the most important data. We tie the main 'loading'
    // state ONLY to this fetch.
    (async () => {
      let predictions = null;
      try {
        predictions = await fetchPredictionsCached(city, () => getPredict(city, 24));
      } catch (err) {
        console.warn("Predictions backend offline → using last known data");
        predictions = predictionData; // fallback to stale data
      }
      setPredictionData(predictions);
      // *** THIS IS THE KEY ***
      // We set loading to false immediately after predictions are done.
      // On a cache hit, this is almost instant.
      setLoading(false);
    })();

    // --- 2. LIVE AQI FETCH (RUNS IN BACKGROUND) ---
    // This fetch runs on its own. It does NOT control any loading
    // state. The data will just "pop in" when it arrives.
    (async () => {
      let aqiData = null;
      try {
        aqiData = await getCurrentAQI(city);
      } catch (err) {
        console.warn("Live AQI backend offline → showing last known value");
        aqiData = currentAqi; // fallback to stale data
      }
      setCurrentAqi(aqiData);
    })();

    // --- 3. POLLUTANTS FETCH (CONTROLS ITS OWN LOADER) ---
    // This runs on its own and controls the 'pollutantsLoading' state.
    (async () => {
      let pollData = null;
      try {
        pollData = await getLivePollutants(city);
      } catch (err) {
        console.warn("Pollutants backend offline:", err);
        pollData = pollutantsData; // fallback
      }
      setPollutantsData(pollData);
      setPollutantsLoading(false);
    })();


    // --- Interval for LIVE data (unchanged) ---
    // This just updates live AQI, it doesn't show a loader
    const interval = setInterval(() => {
      getCurrentAQI(city)
        .then((aqi) => setCurrentAqi(aqi))
        .catch(() => {});
    }, 1800000);

    return () => clearInterval(interval);

  }, [city]); // This effect re-runs when the city changes

  const pollutants = [
    // This will show 'N/A' or '...' until currentAqi is fetched
    ["PM2.5", currentAqi?.pm25, "µg/m³"], 
    ["PM10", pollutantsData?.pm10, "µg/m³"],
    ["NO2", pollutantsData?.no2, "ppb"],
    ["SO2", pollutantsData?.so2, "ppb"],
    ["O3", pollutantsData?.o3, "ppb"],
    ["CO", pollutantsData?.co, "ppm"],
  ];

  return (
    <div className="min-h-screen bg-[--bg] transition-colors">

      <Heatmap />

      {/* This card now gets 'loading=false' *immediately* on a cache hit.
        It will render with 'predData' (from cache) and 'liveAqiData={null}'.
        A moment later, 'liveAqiData' will arrive and the component will 
        re-render to show the "Live" chip. This is progressive rendering.
      */}
      <MainPredictionCard
        liveAqiData={currentAqi}
        predData={predictionData}
        loading={loading}
      />

      <div className="max-w-[1200px] mx-auto mt-6 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

          <RealtimeAQICard city={city} />

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pollutants.map(([name, val, unit]) => (
              <PollutantCard
                key={name}
                name={name}
                value={val}
                unit={unit}
                trend="up"
                // The PM2.5 card now correctly uses the main 'loading' state
                loading={name === "PM2.5" ? loading : pollutantsLoading}
              />
            ))}
          </div>

        </div>
      </div>

      <ForecastCard city={city} hours={24} />

    </div>
  );
}