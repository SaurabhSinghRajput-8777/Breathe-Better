// src/components/ForecastCard.jsx
import React, { useEffect, useState } from "react";
import { getPredict } from "../lib/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export default function ForecastCard({ city = "Delhi", hours = 24 }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]); // [{ datetime, pm25, lower_95, upper_95, hour_index }]
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getPredict(city, hours)
      .then((res) => {
        if (!mounted) return;
        const preds = (res?.predictions || []).map((p) => ({
          datetime: p.datetime,
          hour_index: p.hour_index,
          pm25: parseFloat(p.pm25),
          lower_95: parseFloat(p.lower_95),
          upper_95: parseFloat(p.upper_95),
          label: new Date(p.datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }));
        setData(preds);
      })
      .catch((e) => {
        console.error("Forecast fetch error", e);
        setError(e.message || String(e));
      })
      .finally(() => setLoading(false));
    return () => (mounted = false);
  }, [city, hours]);

  return (
    <section className="max-w-[1200px] mx-auto px-4 md:px-6 mt-6">
      <div
        className="
          rounded-3xl p-4 md:p-6 shadow-xl border
          bg-(--card) border-gray-300 dark:border-gray-700
          transition-colors
        "
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-primary">Hourly Forecast (next {hours}h)</h3>
            <p className="text-sm text-secondary mt-1">Predicted PM2.5 with 95% confidence interval</p>
          </div>

          <div className="text-sm text-secondary">
            {city}
          </div>
        </div>

        <div className="mt-4 h-64">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-secondary">Loading...</div>
          ) : error ? (
            <div className="text-sm text-red-500">Error: {error}</div>
          ) : data.length === 0 ? (
            <div className="text-sm text-secondary">No prediction data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 8 }}>
                <defs>
                  <linearGradient id="ci" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke={getComputedStyle(document.documentElement).getPropertyValue("--grid-color") || "#e6e6e6"} />
                <XAxis dataKey="label" tick={{ fill: "var(--text-secondary)" }} />
                <YAxis tick={{ fill: "var(--text-secondary)" }} />
                <Tooltip />
                <Legend wrapperStyle={{ color: "var(--text-primary)" }} />

                {/* shaded CI area between lower_95 and upper_95 - draw as stacked areas */}
                <Area
                  type="monotone"
                  dataKey="upper_95"
                  stroke="transparent"
                  fill="url(#ci)"
                  activeDot={false}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="pm25"
                  stroke="#2563eb"
                  fill="#93c5fd"
                  strokeWidth={2}
                  dot={false}
                  name="PM2.5"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}
