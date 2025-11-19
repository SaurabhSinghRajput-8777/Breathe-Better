// src/components/ForecastCard.jsx
import React, { useEffect, useState, useContext, useMemo, useRef } from "react";
import { Line } from "react-chartjs-2";
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
import { getPredict } from "../lib/api";
import { fetchPredictionsCached } from "../utils/fetchPredictionsCached"; // 🔥 IMPORT CACHE UTILITY
import { ThemeContext } from "../context/ThemeContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// --- Helper: Get Category Text ---
function getAQICategoryText(pm25) {
  const val = Number(pm25);
  if (val <= 30) return "Good";
  if (val <= 60) return "Satisfactory";
  if (val <= 90) return "Moderate";
  if (val <= 120) return "Poor";
  if (val <= 250) return "Very Poor";
  return "Severe";
}

// --- Helper: Get Category Color ---
function getAQICategoryColor(pm25) {
  const val = Number(pm25);
  if (val <= 30) return "#00B050";      
  if (val <= 60) return "#92D050";     
  if (val <= 90) return "#FFFF00";     
  if (val <= 120) return "#FF9900";    
  if (val <= 250) return "#FF0000";    
  return "#C00000";                     
}

export default function ForecastCard({ city, hours = 24 }) {
  const { theme } = useContext(ThemeContext);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [peakInfo, setPeakInfo] = useState({ value: 0, time: "--", color: "#ccc", category: "" });
  
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      setLoading(true);
      try {
        // 🔥 UPDATED: Use Cached Fetcher
        // We pass a wrapper function () => getPredict(...) so the cache utility calls it only if needed.
        const data = await fetchPredictionsCached(city, () => getPredict(city, hours));
        
        if (data?.predictions?.length > 0) {
          
          // 1. Labels
          const labels = data.predictions.map((p) => {
            const dt = new Date(p.datetime);
            return dt.toLocaleTimeString("en-US", {
              hour: "numeric",
              hour12: true,
            });
          });
          
          // 2. Values
          const values = data.predictions.map((p) => p.pm25);

          // 3. Find Peak
          const maxValue = Math.max(...values);
          const maxIndex = values.indexOf(maxValue);
          const maxTime = labels[maxIndex];
          const maxColor = getAQICategoryColor(maxValue);
          const maxCat = getAQICategoryText(maxValue);

          setPeakInfo({
            value: Math.round(maxValue),
            time: maxTime,
            color: maxColor,
            category: maxCat
          });

          setChartData({
            labels: labels,
            datasets: [
              {
                label: "Forecast",
                data: values,
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointBackgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                pointBorderWidth: 2,
                
                borderColor: (context) => {
                  const chart = context.chart;
                  const { ctx, chartArea } = chart;
                  if (!chartArea) return "#6366f1";
                  
                  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                  gradient.addColorStop(0, "#00B050"); 
                  gradient.addColorStop(0.4, "#FFFF00"); 
                  gradient.addColorStop(0.7, "#FF9900"); 
                  gradient.addColorStop(1, "#C00000");   
                  return gradient;
                },

                backgroundColor: (context) => {
                  const chart = context.chart;
                  const { ctx, chartArea } = chart;
                  if (!chartArea) return "rgba(99, 102, 241, 0.2)";
                  
                  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                  gradient.addColorStop(0, "rgba(0, 176, 80, 0.1)"); 
                  gradient.addColorStop(1, "rgba(192, 0, 0, 0.4)");   
                  return gradient;
                },
              },
            ],
          });
        }
      } catch (err) {
        console.error("Forecast fetch error:", err);
      }
      setLoading(false);
    };

    if (city) {
      fetchPrediction();
    }
  }, [city, hours, theme]); // Dependencies ensure refresh on city/theme change

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme === "dark" ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
        titleColor: theme === "dark" ? "#f8fafc" : "#0f172a",
        bodyColor: theme === "dark" ? "#64748b" : "#475569",
        borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (tooltipItems) => `Time: ${tooltipItems[0].label}`,
          label: (context) => `PM2.5: ${context.parsed.y} µg/m³`,
          afterLabel: (context) => {
            const val = context.parsed.y;
            const cat = getAQICategoryText(val); 
            return `Status: ${cat}`;
          }
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: theme === "dark" ? "#64748b" : "#9ca3af", font: { size: 11 }, maxTicksLimit: 7 },
        border: { display: false },
      },
      y: {
        grid: { color: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)", borderDash: [5, 5] },
        ticks: { color: theme === "dark" ? "#64748b" : "#9ca3af", font: { size: 10 } },
        border: { display: false },
      },
    },
  }), [theme, chartData]);

  // 🔥 UPDATED: Improved Loading Animation (Skeleton)
  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto mt-6 px-4 md:px-6 mb-10 relative z-10">
        <div className="h-[380px] rounded-3xl bg-[var(--card)] border border-[var(--card-border)] shadow-md p-6 md:p-8 relative overflow-hidden">
          {/* Shimmer Effect Overlay */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent z-20"></div>

          {/* Header Skeleton */}
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-3">
              <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              <div className="h-4 w-64 bg-gray-100 dark:bg-gray-800 rounded-md"></div>
            </div>
            <div className="hidden md:block">
               <div className="h-10 w-32 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
            </div>
          </div>

          {/* Chart Area Skeleton */}
          <div className="relative h-[250px] w-full bg-gray-50 dark:bg-gray-800/30 rounded-xl overflow-hidden flex items-end pb-4 px-4 gap-4">
             {/* Fake Bars to mimic chart loading */}
             <div className="w-full h-[40%] bg-gray-200 dark:bg-gray-700/50 rounded-t-sm"></div>
             <div className="w-full h-[60%] bg-gray-200 dark:bg-gray-700/50 rounded-t-sm"></div>
             <div className="w-full h-[30%] bg-gray-200 dark:bg-gray-700/50 rounded-t-sm"></div>
             <div className="w-full h-[80%] bg-gray-200 dark:bg-gray-700/50 rounded-t-sm"></div>
             <div className="w-full h-[50%] bg-gray-200 dark:bg-gray-700/50 rounded-t-sm"></div>
             <div className="w-full h-[70%] bg-gray-200 dark:bg-gray-700/50 rounded-t-sm"></div>
             <div className="w-full h-[45%] bg-gray-200 dark:bg-gray-700/50 rounded-t-sm"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto mt-6 px-4 md:px-6 mb-10 relative z-10">
      <div className="rounded-3xl p-6 md:p-8 shadow-lg bg-[var(--card)] border border-[var(--card-border)] transition-all duration-300">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl font-bold text-primary tracking-tight flex items-center gap-2">
              Hourly Forecast Trend
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                AI Based
              </span>
            </h2>
            <p className="text-sm text-secondary font-medium mt-1">
              Predicting next <span className="text-primary font-semibold">{hours} hours</span> of air quality
            </p>
          </div>

          {peakInfo.value > 0 && (
            <div className="flex items-center gap-3 pl-4 border-l-2 border-gray-100 dark:border-gray-800">
              <div className="text-right">
                <p className="text-[15px] uppercase tracking-wider font-bold text-secondary">
                  Expected Peak
                </p>
                <div className="flex items-center justify-end gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: peakInfo.color }}></span>
                    <p className="text-m font-bold text-primary">
                        {peakInfo.value} <span className="text-sm font-normal text-secondary">µg/m³</span>
                    </p>
                    <span className="text-sm text-secondary font-bold">
                        at {peakInfo.time} Tomorrow
                    </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart Area */}
        <div className="relative h-[300px] w-full">
          {chartData ? (
            <Line ref={chartRef} data={chartData} options={options} />
          ) : (
            <div className="flex h-full items-center justify-center text-secondary">
               No forecast data available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}