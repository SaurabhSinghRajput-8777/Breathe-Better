// src/pages/History.jsx
import React, { useEffect, useState } from "react";
import { getHeatmapGeoJSON } from "../lib/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

const CITIES = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Kolkata"];
const RANGES = [
  { label: "Last 24 Hours", days: 1 },
  { label: "Last 48 Hours", days: 2 },
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
];

export default function History() {
  const [city, setCity] = useState("Delhi");
  const [range, setRange] = useState(1); 
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [city, range]);

  async function fetchHistory() {
    setLoading(true);
    setError(null);

    try {
      const geo = await getHeatmapGeoJSON(city, range);
      const formatted = geo.features
        .map(f => ({
          datetime: f.properties.datetime,
          label: new Date(f.properties.datetime).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
          pm25: Number(f.properties.pm25),
        }))
        .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

      setPoints(formatted);
    } catch (e) {
      console.error("History fetch error:", e);
      setError(String(e.message || e));
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen px-4 md:px-6 pt-20 bg-(--bg) transition-colors">

      {/* Title */}
      <h1 className="text-2xl font-semibold text-primary mb-4 max-w-[1200px] mx-auto">
        Air Quality History
      </h1>

      {/* Filters */}
      <div
        className="
          max-w-[1200px] mx-auto mb-5
          bg-(--card) p-4 rounded-2xl shadow-md
          border border-gray-300 dark:border-gray-700
          flex flex-col md:flex-row gap-4 md:items-center md:justify-between
          transition-colors
        "
      >
        {/* City Selector */}
        <div>
          <label className="block text-secondary text-sm mb-1">Select City</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="
              bg-(--bg) text-primary border border-gray-300 dark:border-gray-700
              rounded-xl px-4 py-2 outline-none transition w-full
            "
          >
            {CITIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Time Range Selector */}
        <div>
          <label className="block text-secondary text-sm mb-1">Past Time Range</label>
          <select
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
            className="
              bg-(--bg) text-primary border border-gray-300 dark:border-gray-700
              rounded-xl px-4 py-2 outline-none transition w-full
            "
          >
            {RANGES.map(r => (
              <option key={r.days} value={r.days}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* History Chart Card */}
      <section className="max-w-[1200px] mx-auto">
        <div
          className="
            rounded-3xl p-6 shadow-xl border
            bg-(--card) border-gray-300 dark:border-gray-700
            transition-colors
          "
        >
          <h2 className="text-lg text-primary font-semibold mb-2">
            PM2.5 Historical Trend
          </h2>
          <p className="text-secondary mb-4">
            Based on the last {range === 1 ? "24 hours" : `${range} days`} of data.
          </p>

          <div className="h-72 w-full">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-secondary">
                Loading...
              </div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : points.length === 0 ? (
              <div className="text-secondary">No historical data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--text-secondary)" }}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-secondary)" }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="pm25"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    name="PM2.5"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
