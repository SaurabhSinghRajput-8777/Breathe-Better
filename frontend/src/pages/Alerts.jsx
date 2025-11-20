// src/pages/Alerts.jsx
import React, { useEffect, useState, useContext, useMemo, useRef } from "react";
import AlertsList from "../components/AlertsList";
import { ThemeContext } from "../context/ThemeContext";
import { getLivePollutants, getPredict } from "../lib/api"; 
import { fetchPollutantsCached } from "../utils/fetchPollutantsCached"; 
import { fetchPredictionsCached } from "../utils/fetchPredictionsCached";

// --- HELPER FUNCTIONS ---
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
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 200) return "Poor";
  if (aqi <= 300) return "Unhealthy";
  if (aqi <= 400) return "Severe";
  return "Hazardous";
}

function getStatusStyles(category) {
  switch (category) {
    case "Good":
    case "Satisfactory":
      return {
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
        border: "border-emerald-500",
        glow: "shadow-emerald-500/20",
        text: "text-emerald-600 dark:text-emerald-400"
      };
    case "Moderate":
    case "Poor":
      return {
        badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
        border: "border-amber-500",
        glow: "shadow-amber-500/20",
        text: "text-amber-600 dark:text-amber-400"
      };
    default: 
      return {
        badge: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30",
        border: "border-rose-500",
        glow: "shadow-rose-500/20",
        text: "text-rose-600 dark:text-rose-400"
      };
  }
}

function getThresholdTheme(val) {
  if (val <= 60) return { color: "text-emerald-500", bg: "bg-emerald-500", border: "border-emerald-200 dark:border-emerald-500/20", softBg: "bg-emerald-50 dark:bg-emerald-500/5" };
  if (val <= 150) return { color: "text-amber-500", bg: "bg-amber-500", border: "border-amber-200 dark:border-amber-500/20", softBg: "bg-amber-50 dark:bg-amber-500/5" };
  return { color: "text-rose-500", bg: "bg-rose-500", border: "border-rose-200 dark:border-rose-500/20", softBg: "bg-rose-50 dark:bg-rose-500/5" };
}

const PRESETS = [
  { label: "Sensitive", val: 50 },
  { label: "Balanced", val: 100 },
  { label: "High Tolerance", val: 200 }
];

const IMPORTANT_CATEGORIES = ["Unhealthy", "Severe", "Hazardous"];

export default function Alerts() {
  const { city } = useContext(ThemeContext);
  const [current, setCurrent] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [threshold, setThreshold] = useState(() => {
    const saved = localStorage.getItem("alert_threshold");
    return saved ? Number(saved) : 100;
  });

  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Persistent timeline for LIVE events only
  const [liveTimeline, setLiveTimeline] = useState([]);
  
  const prevCurrentRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("alert_threshold", threshold);
  }, [threshold]);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    let mounted = true;
    
    const processData = (rawData) => {
      if (!rawData) return;
      const pm25 = rawData.pm25;
      const aqi = pm25ToAQI(pm25);
      const category = getAQICategory(aqi);
      setCurrent({ ...rawData, aqi, category });
    };

    async function loadAllData() {
      setLoading(true); 
      try {
        const cachedLive = await fetchPollutantsCached(city, () => getLivePollutants(city));
        if (mounted && cachedLive) processData(cachedLive);

        const cachedPred = await fetchPredictionsCached(city, () => getPredict(city, 24));
        if (mounted && cachedPred) setPredictions(cachedPred.predictions);
      } catch (err) {
        console.error("Data load failed:", err);
      } finally {
        if (mounted) setLoading(false); 
      }
    }

    loadAllData();
    const timer = setInterval(async () => {
       const fresh = await getLivePollutants(city);
       if (mounted && fresh) processData(fresh);
    }, 30000); 
    
    return () => { mounted = false; clearInterval(timer); };
  }, [city]); 

  // --- 2. DYNAMIC FORECAST ALERT (Calculated, not Logged) ---
  const forecastAlert = useMemo(() => {
    if (!predictions || predictions.length === 0) return null;

    // Find first breach
    const breach = predictions.find(p => p.pm25 >= threshold);
    if (!breach) return null;

    const breachDate = new Date(breach.datetime);
    const timeStr = breachDate.toLocaleTimeString([], {hour: 'numeric', hour12: true});
    const breachVal = Math.round(breach.pm25);

    // Return a dynamic alert object
    return {
      id: "forecast-dynamic", // Static ID prevents re-renders key issues
      type: "High Pollution Forecast",
      source: "AI Forecast",
      city: city,
      val: breachVal,
      category: getAQICategory(pm25ToAQI(breachVal)),
      targetTime: timeStr,
      time: new Date(), // Just for "Created At" display
      desc: <span className="font-bold">Expected to breach {threshold} around {timeStr}</span>
    };
  }, [predictions, threshold, city]);

  // --- 3. LIVE EVENT LOGGING (Only for Severe Weather) ---
  useEffect(() => {
    if (!current) return;

    const isNewData = JSON.stringify(current) !== JSON.stringify(prevCurrentRef.current);
    if (isNewData) {
      if (IMPORTANT_CATEGORIES.includes(current.category)) {
        setLiveTimeline(prev => {
           // Deduplicate recent live alerts
           const last = prev[0];
           if (last && last.type === "Severe Weather Alert" && (Date.now() - last.id < 30 * 60 * 1000)) {
             return prev;
           }
           return [{
             id: Date.now(),
             type: "Severe Weather Alert",
             source: "Live Monitor",
             city: city,
             val: current.pm25,
             category: current.category,
             time: new Date(),
             desc: <span className="font-bold">Current air quality is {current.category}. Take precautions.</span>
           }, ...prev].slice(0, 10);
        });
      }
      prevCurrentRef.current = current;
    }
  }, [current, city]);

  // --- 4. MERGE LISTS ---
  // If forecastAlert exists, put it first. Then add live history.
  const combinedTimeline = forecastAlert ? [forecastAlert, ...liveTimeline] : liveTimeline;

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubscribed(true);
    setEmail(""); 
  };

  const statusStyles = current ? getStatusStyles(current.category) : getStatusStyles("Good");
  const threshTheme = getThresholdTheme(threshold);

  return (
    <div className="min-h-screen bg-[--bg] transition-colors pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/20 rounded-xl text-indigo-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
              </div>
              Alerts & Notifications
            </h1>
            <p className="text-sm text-secondary mt-1 ml-1">
              Smart forecasting alerts for <span className="font-bold text-primary">{city}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* 1. Live Monitor */}
            <div className={`p-6 rounded-3xl bg-[var(--card)] border border-[var(--card-border)] shadow-lg transition-all duration-500 ${statusStyles.glow}`}>
              <h2 className="text-lg font-bold text-primary mb-4">Live Monitor</h2>
              {loading ? (
                 <div className="animate-pulse h-20 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-secondary tracking-wider mb-1">Current PM2.5</p>
                    <div className="flex items-baseline gap-1">
                       <span className={`text-3xl font-extrabold ${statusStyles.text}`}>
                         {current?.pm25 ? Math.round(current.pm25) : "--"}
                       </span>
                       <span className="text-xs text-secondary font-medium">µg/m³</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border ${statusStyles.badge}`}>
                    {current?.category ?? "Unknown"}
                  </div>
                </div>
              )}
            </div>

            {/* 2. THRESHOLD CARD */}
            <div className={`p-5 rounded-3xl border shadow-sm transition-colors duration-300 bg-[var(--card)] ${threshTheme.border}`}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-base font-bold text-primary">Alert Sensitivity</h2>
                  <p className="text-[10px] text-secondary uppercase tracking-wide font-bold mt-0.5">Notify if PM2.5 forecast exceeds:</p>
                </div>
                <div className={`text-xl font-extrabold ${threshTheme.color}`}>
                   {threshold}
                </div>
              </div>
              <div className={`p-3 rounded-2xl border ${threshTheme.softBg} ${threshTheme.border}`}>
                <input 
                  type="range" 
                  min="0" max="300" 
                  value={threshold} 
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer mb-3 bg-gray-200 dark:bg-black/20 accent-current ${threshTheme.color}`}
                />
                <div className="flex gap-2">
                  {PRESETS.map((preset) => {
                    const isActive = threshold === preset.val;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => setThreshold(preset.val)}
                        className={`
                          flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all border hover:cursor-pointer
                          ${isActive 
                            ? `${threshTheme.bg} text-white border-transparent shadow-sm` 
                            : "bg-white dark:bg-white/10 text-secondary border-transparent hover:border-gray-200"}
                        `}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 3. Subscription Card */}
            <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--card-border)] shadow-sm relative overflow-hidden">
              <h2 className="text-lg font-bold text-primary mb-4 relative z-10">Email Updates</h2>
              {!isSubscribed ? (
                <form onSubmit={handleSubscribe} className="flex flex-col gap-3 relative z-10">
                  <input 
                    type="email" 
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-primary focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                  />
                  <button 
                    type="submit"
                    className="w-full py-3 rounded-xl hover:cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg hover:shadow-indigo-500/30 active:scale-95"
                  >
                    Activate
                  </button>
                </form>
              ) : (
                <div className="flex flex-col items-center text-center py-4 animate-in fade-in zoom-in relative z-10">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full flex items-center justify-center mb-3 shadow-inner">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h3 className="text-primary font-bold hover:cursor-pointer">Active</h3>
                  <p className="text-xs text-secondary mt-1">You will be notified if PM2.5 exceeds {threshold}.</p>
                  <button onClick={() => setIsSubscribed(false)} className="mt-4 text-xs font-bold hover:cursor-pointer text-rose-500 hover:underline">Deactivate</button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2">
             {/* 🔥 Pass combinedTimeline (Forecast + History) */}
             <AlertsList timeline={combinedTimeline} onClear={() => setLiveTimeline([])} />
          </div>

        </div>
      </div>
    </div>
  );
}