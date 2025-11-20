// src/components/HealthRecommendationCard.jsx
import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

// --- 1. CALCULATIONS (Indian Standard) ---
function pm25ToAQI(pm25) {
  if (pm25 === null || pm25 === undefined || isNaN(parseFloat(pm25))) return 0;
  const pm = parseFloat(pm25);
  if (pm <= 30) return Math.round((50 / 30) * pm);
  if (pm <= 60) return Math.round(((100 - 51) / (60 - 30)) * (pm - 30) + 51);
  if (pm <= 90) return Math.round(((200 - 101) / (90 - 60)) * (pm - 60) + 101);
  if (pm <= 120) return Math.round(((300 - 201) / (120 - 90)) * (pm - 90) + 201);
  if (pm <= 250) return Math.round(((400 - 301) / (250 - 120)) * (pm - 120) + 301);
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

// --- 2. RECOMMENDATIONS LOGIC ---
function getRecommendations(category) {
  switch (category) {
    case "Good":
      return [
        { icon: "sport", title: "Outdoor Sports", desc: "Perfect time for a run", status: "safe" },
        { icon: "window", title: "Ventilation", desc: "Open windows freely", status: "safe" },
        { icon: "mask", title: "Mask Usage", desc: "Not required", status: "safe" },
        { icon: "kids", title: "Kids & Seniors", desc: "Safe for outdoor play", status: "safe" },
      ];
    case "Moderate":
      return [
        { icon: "sport", title: "Outdoor Sports", desc: "Okay for most people", status: "warning" },
        { icon: "window", title: "Ventilation", desc: "Keep air flowing", status: "safe" },
        { icon: "mask", title: "Mask Usage", desc: "Optional for sensitive", status: "safe" },
        { icon: "kids", title: "Kids & Seniors", desc: "Monitor for symptoms", status: "warning" },
      ];
    case "Poor":
      return [
        { icon: "sport", title: "Outdoor Sports", desc: "Reduce intensity", status: "warning" },
        { icon: "window", title: "Ventilation", desc: "Close if hazy outside", status: "warning" },
        { icon: "mask", title: "Mask Usage", desc: "Recommended if coughing", status: "warning" },
        { icon: "kids", title: "Kids & Seniors", desc: "Limit outdoor time", status: "danger" },
      ];
    case "Unhealthy":
      return [
        { icon: "sport", title: "Outdoor Sports", desc: "Avoid prolonged exertion", status: "danger" },
        { icon: "window", title: "Ventilation", desc: "Keep windows closed", status: "danger" },
        { icon: "mask", title: "Mask Usage", desc: "Required outdoors", status: "warning" },
        { icon: "kids", title: "Kids & Seniors", desc: "Stay indoors mostly", status: "danger" },
      ];
    case "Severe":
    case "Hazardous":
      return [
        { icon: "sport", title: "Outdoor Sports", desc: "Avoid completely", status: "danger" },
        { icon: "window", title: "Ventilation", desc: "Seal all gaps", status: "danger" },
        { icon: "mask", title: "Mask Usage", desc: "N95 Mandatory", status: "danger" },
        { icon: "kids", title: "Kids & Seniors", desc: "Strictly indoors", status: "danger" },
      ];
    default:
      return [];
  }
}

// --- 3. ICONS (Clean SVG) ---
const ICONS = {
  sport: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
    </svg>
  ),
  window: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h16v16H4V4z M4 12h16 M12 4v16"></path>
    </svg>
  ),
  mask: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
  ),
  kids: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
  )
};

// --- 4. THEMED COLORS ---
const STYLES = {
  safe: {
    border: "border-l-emerald-500",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    border: "border-l-amber-500", 
    icon: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    border: "border-l-red-600", 
    icon: "text-red-600 dark:text-red-400",
  }
};

export default function HealthRecommendationCard({ pm25 }) {
  const { theme } = useContext(ThemeContext);

  const aqi = pm25ToAQI(pm25);
  const category = getAQICategory(aqi);
  const recommendations = getRecommendations(category);

  // 🔥 FIX: Manually set background colors based on app theme context
  // This prevents system/OS dark mode preferences from breaking the UI
  const innerCardClass = theme === 'dark' 
    ? "bg-white/5 border-white/10" 
    : "bg-gray-50 border-gray-100";

  const iconBoxClass = theme === 'dark'
    ? "bg-white/10"
    : "bg-white shadow-sm";

  if (!pm25) return null;

  return (
    <div className="max-w-[1200px] mx-auto mt-6 px-4 md:px-6">
      <div 
        className="
          bg-[var(--card)] border border-[var(--card-border)]
          rounded-3xl p-6 md:p-8 shadow-lg
          transition-all duration-300
        "
      >
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary tracking-tight">Health Guide</h2>
              <p className="text-sm text-secondary font-medium">
                Safety measures for <span className="font-bold text-primary">{category}</span> air quality
              </p>
            </div>
          </div>
        </div>

        {/* Grid Layout for Recommendations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendations.map((rec, index) => {
            const style = STYLES[rec.status];
            
            return (
              <div 
                key={index}
                className={`
                  relative flex items-start gap-4 p-4 rounded-2xl 
                  ${innerCardClass}
                  border-l-4 shadow-sm
                  transition-all duration-300
                  hover:-translate-y-1 hover:shadow-md
                  ${style.border} 
                `}
              >
                {/* Icon Box */}
                <div className={`p-2.5 rounded-xl ${iconBoxClass} ${style.icon}`}>
                  {ICONS[rec.icon]}
                </div>

                {/* Text Content */}
                <div>
                  <h3 className="text-sm font-bold text-primary mb-0.5">
                    {rec.title}
                  </h3>
                  <p className="text-xs font-medium text-secondary opacity-90">
                    {rec.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}