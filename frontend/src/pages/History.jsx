// src/pages/History.jsx
import React, { useState, useEffect, useContext } from "react";
import { Line } from "react-chartjs-2";
import { ThemeContext } from "../context/ThemeContext";
import { getHistory } from "../lib/api"; 
import { fetchHistoryCached } from "../utils/fetchHistoryCached"; // 🔥 Import Cache Utility
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function History() {
  const { theme, city } = useContext(ThemeContext);
  const [timeRange, setTimeRange] = useState(7); // Days as number
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 FETCH DATA WITH CACHE
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Use the cached fetcher wrapper
        // It checks localStorage first; if missing, calls getHistory(city, timeRange)
        const res = await fetchHistoryCached(city, timeRange, () => getHistory(city, timeRange));
        
        if (res && res.history) {
          setHistoryData(res.history);
        }
      } catch (err) {
        console.error("History fetch failed", err);
      }
      setLoading(false);
    }
    fetchData();
  }, [city, timeRange]);

  // Calculate Stats from Real Data
  const vals = historyData.map(d => d.pm25);
  const average = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  const max = vals.length ? Math.max(...vals) : 0;
  const min = vals.length ? Math.min(...vals) : 0;

  const chartData = {
    // Format dates cleanly
    labels: historyData.map(d => new Date(d.datetime).toLocaleDateString("en-US", { 
        weekday: 'short', day: 'numeric', hour: 'numeric' 
    })),
    datasets: [{
      label: 'PM2.5 (Observed)',
      data: vals,
      borderColor: theme === 'dark' ? '#818cf8' : '#4f46e5',
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, theme === 'dark' ? 'rgba(129, 140, 248, 0.4)' : 'rgba(79, 70, 229, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
      pointRadius: 2, // Smaller points for detailed history
      pointBackgroundColor: theme === 'dark' ? '#1e1b4b' : '#ffffff',
      pointBorderWidth: 1,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { display: false } }, // Hide X labels if too crowded
      y: { grid: { color: theme === 'dark' ? '#374151' : '#e5e7eb' }, ticks: { color: theme === 'dark' ? '#9ca3af' : '#6b7280' } }
    }
  };

  return (
    <div className="min-h-screen bg-[--bg] transition-colors pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/20 rounded-xl text-indigo-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              Historical Data
            </h1>
            <p className="text-sm text-secondary mt-1">Real observed data for <span className="font-bold text-primary">{city}</span>.</p>
          </div>

          <div className="flex items-center gap-3">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setTimeRange(d)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  timeRange === d 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:cursor-pointer" 
                    : "bg-[var(--card)] text-secondary border border-[var(--card-border)] hover:cursor-pointer hover:border-indigo-500/50"
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard label="Average PM2.5" value={average} unit="µg/m³" color="text-indigo-500" />
          <StatCard label="Lowest Recorded" value={min} unit="µg/m³" color="text-emerald-500" />
          <StatCard label="Highest Recorded" value={max} unit="µg/m³" color="text-rose-500" />
        </div>

        {/* Main Chart */}
        <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--card-border)] shadow-lg">
          <h2 className="text-lg font-bold text-primary mb-6">Pollution Trend</h2>
          <div className="h-[400px] w-full">
            {loading ? (
                 <div className="h-full w-full flex items-center justify-center text-secondary animate-pulse">Loading History...</div>
            ) : (
                 <Line data={chartData} options={options} />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, unit, color }) {
  return (
    <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--card-border)] shadow-sm flex flex-col items-center justify-center text-center">
      <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">{label}</p>
      <div className={`text-4xl font-extrabold ${color}`}>
        {value} <span className="text-lg text-secondary font-medium">{unit}</span>
      </div>
    </div>
  );
}