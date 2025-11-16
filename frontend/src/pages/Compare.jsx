// src/pages/Compare.jsx
import React, { useState } from "react";
import { getHeatmapGeoJSON } from "../lib/api"; // Uses historical data
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  PointElement,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  PointElement,
  LinearScale,
  Tooltip,
  Legend
);

const CITIES = [
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Kolkata",
];

// Helper function to process GeoJSON data into a chart format
function processData(data, city) {
  const points = data.features.map(f => ({
    datetime: new Date(f.properties.datetime),
    pm25: f.properties.pm25
  }));

  // Group by hour
  const grouped = {};
  points.forEach(p => {
    if (p.pm25 === null) return; // Skip null values
    const hour = p.datetime.toISOString().slice(0, 13); // YYYY-MM-DD HH
    if (!grouped[hour]) grouped[hour] = [];
    grouped[hour].push(p.pm25);
  });

  const labels = Object.keys(grouped).sort();
  const values = labels.map(l => {
    const arr = grouped[l];
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  });

  return { labels, values };
}


export default function Compare() {
  const [cityA, setCityA] = useState("Delhi");
  const [cityB, setCityB] = useState("Mumbai");
  const [days, setDays] = useState(7); // <-- State for time range
  
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [labels, setLabels] = useState([]); // Shared labels for X-axis

  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setDataA(null); // Clear old data
    setDataB(null); // Clear old data

    try {
      // Use 'days' state in the API call
      const [respA, respB] = await Promise.all([
        getHeatmapGeoJSON(cityA, days), 
        getHeatmapGeoJSON(cityB, days),
      ]);

      // Process both datasets
      const processedA = processData(respA, cityA);
      const processedB = processData(respB, cityB);

      // Find all unique labels and sort them
      const allLabels = [...new Set([...processedA.labels, ...processedB.labels])].sort();
      setLabels(allLabels);

      // Map data to the shared labels
      const mapData = (processed) => {
        const dataMap = new Map(processed.labels.map((l, i) => [l, processed.values[i]]));
        return allLabels.map(l => dataMap.get(l) || null); // Use null for missing data points
      };
      
      setDataA(mapData(processedA));
      setDataB(mapData(processedB));

    } catch (err) {
      console.error("Fetch Error:", err);
    }

    setLoading(false);
  };

  const graphData = {
    labels: labels.map(l => new Date(l).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' })), // Format labels
    datasets: [
      {
        label: cityA,
        data: dataA,
        borderColor: "#4F46E5", // Indigo
        tension: 0.3,
        spanGaps: true, // Connect lines over 'null' gaps
      },
      {
        label: cityB,
        data: dataB,
        borderColor: "#EC4899", // Pink
        tension: 0.3,
        spanGaps: true, // Connect lines over 'null' gaps
      },
    ],
  };

  // Get text for the time range dropdown
  const timeRangeTextMap = {
    1: "Past 24 Hours",
    3: "Past 3 Days",
    7: "Past 7 Days",
    30: "Past 30 Days",
  };
  const timeRangeText = timeRangeTextMap[days];


  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 text-primary">
      <h1 className="text-3xl font-bold mb-6">Compare Air Quality ({timeRangeText})</h1>

      {/* --- UPDATED GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Select City A */}
        <div className="flex flex-col">
          <label className="text-secondary mb-1">Select City A</label>
          <select
            value={cityA}
            onChange={(e) => setCityA(e.target.value)}
            className="p-3 rounded-xl border dark:bg-(--card) bg-white border-gray-300 dark:border-gray-700 text-primary"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Select City B */}
        <div className="flex flex-col">
          <label className="text-secondary mb-1">Select City B</label>
          <select
            value={cityB}
            onChange={(e) => setCityB(e.target.value)}
            className="p-3 rounded-xl border dark:bg-(--card) bg-white border-gray-300 dark:border-gray-700 text-primary"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        
        {/* --- TIME RANGE DROPDOWN --- */}
        <div className="flex flex-col">
          <label className="text-secondary mb-1">Time Range</label>
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="p-3 rounded-xl border dark:bg-(--card) bg-white border-gray-300 dark:border-gray-700 text-primary"
          >
            <option value={1}>Past 24 Hours</option>
            <option value={3}>Past 3 Days</option>
            <option value={7}>Past 7 Days</option>
            <option value={30}>Past 30 Days</option>
          </select>
        </div>

        {/* Compare Button */}
        <div className="flex items-end">
          <button
            onClick={fetchData}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            {loading ? "Comparing..." : "Compare"}
          </button>
        </div>
      </div>

      {/* --- 
        THIS IS THE FIXED LOGIC 
        --- 
      */}
      <div className="mt-10 p-6 rounded-2xl bg-white dark:bg-(--card) shadow border border-gray-200 dark:border-gray-700">
        {loading ? (
          <p className="text-secondary">Loading data...</p>
        ) : dataA && dataB ? (
          <Line data={graphData} />
        ) : (
          <p className="text-secondary">Select cities and click Compare.</p>
        )}
      </div>

      {/* Summary Box */}
      {dataA && dataB && (
        <div className="mt-8 p-6 rounded-2xl bg-white dark:bg-(--card) shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Summary</h2>
          
          {(() => {
            const avg = (arr) => {
              const valid = arr.filter(v => v !== null);
              if (valid.length === 0) return 0;
              return valid.reduce((a, b) => a + b, 0) / valid.length;
            };
            const avgA = avg(dataA);
            const avgB = avg(dataB);
            
            return (
              <>
                <p className="text-secondary">
                  Avg PM2.5 in {cityA}:{" "}
                  <b>{avgA.toFixed(1)}</b>
                </p>
                <p className="text-secondary">
                  Avg PM2.5 in {cityB}:{" "}
                  <b>{avgB.toFixed(1)}</b>
                </p>
                <hr className="my-3 border-gray-300 dark:border-gray-700" />
                <p className="text-primary font-semibold">
                  {avgA === avgB
                    ? "Both cities had similar air quality."
                    : avgA < avgB
                    ? `${cityA} has had cleaner air on average.`
                    : `${cityB} has had cleaner air on average.`}
                </p>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}