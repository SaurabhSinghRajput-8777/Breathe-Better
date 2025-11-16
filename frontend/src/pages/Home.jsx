// src/pages/Home.jsx
import React, { useEffect, useState, useContext } from "react";
import Heatmap from "../components/Heatmap";
import MainPredictionCard from "../components/MainPredictionCard";
import RealtimeAQICard from "../components/RealtimeAQICard";
import PollutantCard from "../components/PollutantCard";
import ForecastCard from "../components/ForecastCard";
import { ThemeContext } from "../context/ThemeContext";
import { getCurrentAQI, getPredict, getLivePollutants } from "../lib/api";

// -------------------------------
// AQI CALCULATION FUNCTIONS
// -------------------------------
function pm25ToAQI(pm25) {
  if (!pm25) return 0;
  if (pm25 <= 12) return (50 / 12) * pm25;
  if (pm25 <= 35.4) return ((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51;
  if (pm25 <= 55.4) return ((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101;
  if (pm25 <= 150.4) return ((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151;
  if (pm25 <= 250.4) return ((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201;
  if (pm25 <= 350.4) return ((400 - 301) / (350.4 - 250.5)) * (pm25 - 250.5) + 301;
  return 500;
}

function getAQICategory(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for SG";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}


export default function Home() {
  const { city } = useContext(ThemeContext);
  const [currentAqi, setCurrentAqi] = useState(null);
  
  // This state now holds the data for the MainPredictionCard
  const [predictionCardData, setPredictionCardData] = useState({
    aqi: "...",
    category: "Loading...",
    pm25: "...",
    time: "...",
  });
  
  const [pollutantsData, setPollutantsData] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [pollutantsLoading, setPollutantsLoading] = useState(true);

  // --------------------------
  // Fetch ALL data
  // --------------------------
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setPollutantsLoading(true);
      
      // Set card to loading state
      setPredictionCardData({
        aqi: "...",
        category: "Loading...",
        pm25: "...",
        time: "...",
      });

      // Run fetches in parallel
      const aqiPromise = getCurrentAQI(city).catch(err => {
        console.error("Error fetching current AQI data:", err);
        return null;
      });
      
      const predPromise = getPredict(city, 24).catch(err => {
        console.error("Error fetching prediction data:", err);
        return null; 
      });
      
      const pollPromise = getLivePollutants(city).catch(err => {
        console.error("Error fetching pollutant data:", err);
        return null; 
      });

      // Wait for all data
      const [aqiData, predData, pollData] = await Promise.all([aqiPromise, predPromise, pollPromise]);

      // Set states
      if (aqiData) setCurrentAqi(aqiData);
      if (pollData) setPollutantsData(pollData);
      
      // 🔥 THE FIX: Process prediction data here
      if (predData && predData.predictions && predData.predictions.length > 0) {
        const firstPrediction = predData.predictions[0];
        const pm25 = firstPrediction.pm25.toFixed(1);
        const aqi = Math.round(pm25ToAQI(pm25));
        
        setPredictionCardData({
          aqi: aqi,
          category: getAQICategory(aqi),
          pm25: pm25,
          time: new Date(firstPrediction.datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        });
        
      } else {
        // Handle prediction fail
        setPredictionCardData({
          aqi: "N/A",
          category: "Unavailable",
          pm25: "N/A",
          time: "Error",
        });
      }

      setLoading(false); 
      setPollutantsLoading(false); 
    };

    fetchAllData();
    // Use a 30-minute interval as you had in your original file
    const interval = setInterval(fetchAllData, 1800000); 
    return () => clearInterval(interval);
  }, [city]); 

  // --------------------------
  // POLLUTANT CARDS (Now dynamic)
  // --------------------------
  const pollutants = [
    ["PM2.5", currentAqi?.pm25, "µg/m³"], 
    ["PM10", pollutantsData?.pm10, "µg/m³"], 
    ["NO2", pollutantsData?.no2, "ppb"], 
    ["SO2", pollutantsData?.so2, "ppb"],
    ["O3", pollutantsData?.o3, "ppb"], 
    ["CO", pollutantsData?.co, "ppm"],
  ];

  return (
    <div className="min-h-screen bg-(--bg) transition-colors">
      {/* MAP */}
      <Heatmap />

      {/* 24H PREDICTION CARD (Now wired to state) */}
      <MainPredictionCard pred={predictionCardData} />

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
                loading={name === 'PM2.5' ? loading : pollutantsLoading} 
              />
            ))}
          </div>

        </div>
      </div>

      {/* FORECAST GRAPH CARD */}
      <ForecastCard city={city} hours={24} /> 
    </div>
  );
}