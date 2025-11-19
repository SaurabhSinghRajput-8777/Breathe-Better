// src/components/RealtimeAQICard.jsx
import React, { useEffect, useState, useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

// 1. ADDED: AQI Conversion Formula (Same as MainPredictionCard)
function pm25ToAQI(pm25) {
  if (pm25 === null || pm25 === undefined || isNaN(parseFloat(pm25))) return 0;
  const pm = parseFloat(pm25);

  // Indian CPCB Breakpoints for PM2.5
  // 0-30     -> AQI 0-50    (Good)
  // 30-60    -> AQI 51-100  (Satisfactory)
  // 60-90    -> AQI 101-200 (Moderate)
  // 90-120   -> AQI 201-300 (Poor)
  // 120-250  -> AQI 301-400 (Very Poor)
  // 250+     -> AQI 401-500 (Severe)

  if (pm <= 30) return Math.round((50 / 30) * pm);
  
  if (pm <= 60) return Math.round(((100 - 51) / (60 - 30)) * (pm - 30) + 51);
  
  if (pm <= 90) return Math.round(((200 - 101) / (90 - 60)) * (pm - 60) + 101);
  
  if (pm <= 120) return Math.round(((300 - 201) / (120 - 90)) * (pm - 90) + 201);
  
  if (pm <= 250) return Math.round(((400 - 301) / (250 - 120)) * (pm - 120) + 301);
  
  // For severe pollution (>250), India scales differently than US
  if (pm > 250) return Math.round(((500 - 401) / (380 - 250)) * (pm - 250) + 401); 
  
  return 500;
}

function getAQICategory(aqi) {
  if (aqi === null || aqi === "...") return "Loading...";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 200) return "Poor";
  if (aqi <= 300) return "Unhealthy";
  if (aqi <= 400) return "Severe";
  return "Hazardous";
}

function getStatusColor(aqi) {
  if (aqi <= 50) return "#00E400";      
  if (aqi <= 100) return "#F0D400";     
  if (aqi <= 200) return "#F07554";     
  if (aqi <= 300) return "#F54E8E";     
  if (aqi <= 400) return "#8F3F97";     
  return "#7E0023";                     
}

function getGradientTargetColor(aqi) {
  if (aqi <= 50) return "#69FF69";      
  if (aqi <= 100) return "#FFFF4A";     
  if (aqi <= 200) return "#FC896A";     
  if (aqi <= 300) return "#FF6E9F40";   
  if (aqi <= 400) return "#AB4BB4";     
  return "#A3002E";                     
}

export default function RealtimeAQICard({ city = "Delhi" }) {
  const { theme } = useContext(ThemeContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAQI = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/live_pollutants?city=${city}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching current AQI:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAQI();
    const interval = setInterval(fetchAQI, 30000);
    return () => clearInterval(interval);
  }, [city]);

  // 🔥 FIX: Convert raw PM2.5 to AQI Index here
  const rawPm25 = data?.pm25 ?? 0;
  const aqi = pm25ToAQI(rawPm25); // Use the calculated AQI for display

  // Note: The 'category' comes from backend, which might be based on raw PM2.5.
  // If the category text looks wrong compared to the number, let me know!
  const category = loading ? "Loading..." : getAQICategory(aqi)
  
  const datetime = data?.datetime 
    ? new Date(data.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : "--:--";

  const ringColor = getStatusColor(aqi);
  const gradientBottom = getGradientTargetColor(aqi);

  const radius = 90;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(aqi, 500) / 500) * circumference;

  return (
    <div 
      className="h-full flex flex-col relative overflow-hidden rounded-3xl bg-[var(--card)] border border-[var(--card-border)] shadow-md p-6 transition-all"
      style={{
        //background: `linear-gradient(to bottom, var(--card) 30%, ${gradientBottom} 150%)`
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4 z-10">
        <div>
          <h2 className="text-lg font-bold text-primary">Live AQI Monitor</h2>
          <p className="text-xs text-secondary uppercase tracking-wider font-semibold">
            {city} Station
          </p>
        </div>
        <div className="flex items-center gap-2 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
          </span>
          <span className="text-[10px] font-bold text-red-600 uppercase">Live</span>
        </div>
      </div>

      {/* Central Gauge */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-4">
        <div className="relative flex items-center justify-center">
          <svg
            height={radius * 2.5}
            width={radius * 2.5}
            className="transform -rotate-90 transition-all duration-1000 ease-out"
          >
            <circle
              stroke="currentColor"
              strokeWidth={stroke}
              fill="transparent"
              r={normalizedRadius}
              cx={radius * 1.25}
              cy={radius * 1.25}
              className="text-gray-400 dark:text-gray-400 "
            />
            <circle
              stroke={ringColor}
              strokeWidth={stroke}
              strokeDasharray={circumference + " " + circumference}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              fill="transparent"
              r={normalizedRadius}
              cx={radius * 1.25}
              cy={radius * 1.25}
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span 
              className={`font-extrabold text-primary transition-all ${String(aqi).length > 3 ? "text-3xl" : "text-4xl"}`}
            >
              {loading ? "..." : aqi}
            </span>
            <span className="text-xs font-medium text-secondary">AQI</span>
          </div>
        </div>

        <div 
          className="mt-4 px-4 py-1 rounded-full text-sm font-bold border shadow-sm backdrop-blur-sm"
          style={{ 
            borderColor: ringColor, 
            backgroundColor: `${ringColor}20`,
            color: ringColor 
          }}
        >
          {category}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto text-center border-t border-[var(--card-border)] pt-3 z-10">
        <p className="text-xs text-secondary">
          Last updated: <span className="font-medium text-primary">{datetime}</span>
        </p>
      </div>
    </div>
  );
}