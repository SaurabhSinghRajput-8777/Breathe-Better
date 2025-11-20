// src/pages/Compare.jsx
import React, { useState, useContext, useEffect } from "react";
import { getHistory } from "../lib/api"; 
import { fetchHistoryCached } from "../utils/fetchHistoryCached"; // 🔥 Import Cache Utility
import { Line, Bar } from "react-chartjs-2";
import { ThemeContext } from "../context/ThemeContext";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  PointElement,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  LineElement,
  BarElement,
  CategoryScale,
  PointElement,
  LinearScale,
  Tooltip,
  Legend,
  Filler
);

const CITIES = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Kolkata"];

export default function Compare() {
  const { theme } = useContext(ThemeContext);
  const [cityA, setCityA] = useState("Delhi");
  const [cityB, setCityB] = useState("Mumbai");
  const [days, setDays] = useState(7);
  
  const [dataA, setDataA] = useState([]);
  const [dataB, setDataB] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(false);

  const [avgA, setAvgA] = useState(0);
  const [avgB, setAvgB] = useState(0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // 🔥 FIX: Use Cached Fetcher
        const [resA, resB] = await Promise.all([
          fetchHistoryCached(cityA, days, () => getHistory(cityA, days)),
          fetchHistoryCached(cityB, days, () => getHistory(cityB, days))
        ]);

        // Helper to extract values
        const process = (res) => (res?.history || []).map(d => d.pm25);
        const dates = (resA?.history || []).map(d => 
            new Date(d.datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' })
        );

        const valsA = process(resA);
        const valsB = process(resB);

        setLabels(dates);
        setDataA(valsA);
        setDataB(valsB);

        // Averages
        const getAvg = (arr) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
        setAvgA(getAvg(valsA));
        setAvgB(getAvg(valsB));

      } catch (err) {
        console.error("Comparison failed", err);
      }
      setLoading(false);
    }
    fetchData();
  }, [cityA, cityB, days]);

  // --- CHART OPTIONS ---
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: theme === 'dark' ? '#fff' : '#111827',
        bodyColor: theme === 'dark' ? '#9ca3af' : '#4b5563',
        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      x: { display: false },
      y: { 
        grid: { color: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, 
        ticks: { color: theme === 'dark' ? '#9ca3af' : '#6b7280', font: {size: 10} } 
      }
    }
  };

  const lineChartData = {
    labels,
    datasets: [
      {
        label: cityA,
        data: dataA,
        borderColor: "#6366f1", // Indigo
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
      {
        label: cityB,
        data: dataB,
        borderColor: "#ec4899", // Pink
        backgroundColor: "rgba(236, 72, 153, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
    ],
  };
  
  const barChartData = {
    labels: ["Average PM2.5"],
    datasets: [
      { label: cityA, data: [avgA], backgroundColor: "#6366f1", borderRadius: 8, barPercentage: 0.5 },
      { label: cityB, data: [avgB], backgroundColor: "#ec4899", borderRadius: 8, barPercentage: 0.5 },
    ],
  };

  return (
    <div className="min-h-screen bg-[--bg] transition-colors pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        
        {/* HEADER & CONTROLS (Restored Previous Layout) */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              </div>
              City Comparison
            </h1>
            <p className="text-sm text-secondary mt-1 ml-1">Analyze air quality differences.</p>
          </div>

          {/* Control Bar */}
          <div className="flex items-center gap-4 p-2 bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-sm">
             <CitySelect value={cityA} onChange={setCityA} color="text-indigo-500" />
             
             {/* 🔥 FIX: VS Circle with Explicit Colors */}
             <div className="shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-black text-gray-600 dark:text-gray-300">
               VS
             </div>
             
             <CitySelect value={cityB} onChange={setCityB} color="text-pink-500" />
             
             <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2"></div>
             
             <select 
               value={days} 
               onChange={(e) => setDays(Number(e.target.value))}
               className="bg-transparent text-sm font-bold text-primary outline-none cursor-pointer"
             >
                <option value={1}>24 Hours</option>
                <option value={3}>3 Days</option>
                <option value={7}>7 Days</option>
                <option value={30}>30 Days</option>
             </select>
          </div>
        </div>

        {/* STATS ROW (50/50 Split) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
           
           {/* Card 1: Winner */}
           <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Cleaner City</p>
                    <h2 className="text-3xl font-extrabold tracking-tight">
                      {loading ? "..." : (avgA < avgB ? cityA : cityB)}
                    </h2>
                 </div>
                 <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center text-xl backdrop-blur-sm">
                    🏆
                 </div>
              </div>
              <p className="text-xs text-indigo-100 opacity-90 font-medium">
                Maintains better air quality on average over the last {days} days.
              </p>
           </div>

           {/* Card 2: Gap Analysis */}
           <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--card-border)] shadow-sm flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Pollution Gap</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-extrabold text-primary">
                          {loading ? "..." : `${Math.abs(Math.round(avgA - avgB))}`}
                        </h2>
                        <span className="text-sm font-medium text-secondary">µg/m³ difference</span>
                    </div>
                 </div>
                 {/* Mini Visual Indicator */}
                 <div className="flex gap-1 h-8 items-end">
                    <div className="w-2 bg-indigo-500 rounded-t-sm" style={{ height: '60%' }}></div>
                    <div className="w-2 bg-pink-500 rounded-t-sm" style={{ height: '100%' }}></div>
                 </div>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-auto overflow-hidden">
                 <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-pink-500" 
                    style={{ width: `${(Math.min(avgA, avgB) / Math.max(avgA, avgB)) * 100}%` }}
                 ></div>
              </div>
           </div>
        </div>

        {/* CHARTS ROW (50/50 Split) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           
           {/* Chart 1: Trend */}
           <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--card-border)] shadow-md h-[350px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-lg text-primary">Trend Comparison</h3>
                 <div className="flex gap-4 text-xs font-bold">
                    <span className="flex items-center gap-1 text-indigo-500"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> {cityA}</span>
                    <span className="flex items-center gap-1 text-pink-500"><div className="w-2 h-2 rounded-full bg-pink-500"></div> {cityB}</span>
                 </div>
              </div>
              <div className="flex-1 w-full min-h-0">
                 {loading ? (
                    <div className="h-full flex items-center justify-center text-secondary animate-pulse">Loading Trend Data...</div>
                 ) : (
                    <Line data={lineChartData} options={commonOptions} />
                 )}
              </div>
           </div>

           {/* Chart 2: Average Bar */}
           <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--card-border)] shadow-md h-[350px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-lg text-primary">Average PM2.5</h3>
                 <span className="text-xs font-bold text-secondary bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    Lower is Better
                 </span>
              </div>
              <div className="flex-1 w-full min-h-0">
                 {loading ? (
                    <div className="h-full flex items-center justify-center text-secondary animate-pulse">Calculating...</div>
                 ) : (
                    <Bar 
                      data={barChartData} 
                      options={{
                        ...commonOptions,
                        scales: { 
                            x: { display: false }, 
                            y: { display: false } 
                        }
                      }} 
                    />
                 )}
              </div>
              
              {/* Footer Stats */}
              <div className="mt-2 flex justify-around text-center border-t border-[var(--card-border)] pt-4">
                 <div>
                    <span className="block text-2xl font-bold text-indigo-500">{Math.round(avgA)}</span>
                    <span className="text-xs font-bold text-secondary uppercase">{cityA}</span>
                 </div>
                 <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
                 <div>
                    <span className="block text-2xl font-bold text-pink-500">{Math.round(avgB)}</span>
                    <span className="text-xs font-bold text-secondary uppercase">{cityB}</span>
                 </div>
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}

// Helper for Dropdowns
function CitySelect({ value, onChange, color }) {
  return (
    <div className="relative group">
       <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className={`appearance-none bg-transparent pl-3 pr-8 py-2 font-bold cursor-pointer outline-none ${color} hover:opacity-80 transition-opacity`}
       >
          {CITIES.map(c => (
             <option key={c} value={c} className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800">
               {c}
             </option>
          ))}
       </select>
       <div className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${color}`}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
       </div>
    </div>
  );
}