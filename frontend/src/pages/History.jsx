import React, { useEffect, useState, useContext } from "react"; // Import useContext
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { ThemeContext } from "../context/ThemeContext"; // Import context
import { getHeatmapGeoJSON } from "../lib/api"; // Import API function

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function History() {
  const { city, setCity } = useContext(ThemeContext); // Use global city
  const [days, setDays] = useState(3);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);

  // ---------------------------
  // FETCH HISTORICAL PM2.5 DATA
  // ---------------------------
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        // FIX: Use API library and global city
        const data = await getHeatmapGeoJSON(city, days);

        // Convert geojson → time series
        const points = data.features.map(f => ({
          datetime: new Date(f.properties.datetime),
          pm25: f.properties.pm25
        }));

        // Group by hour
        const grouped = {};
        points.forEach(p => {
          const hour = p.datetime.toISOString().slice(0, 13); // YYYY-MM-DD HH
          if (!grouped[hour]) grouped[hour] = [];
          grouped[hour].push(p.pm25);
        });

        const labels = Object.keys(grouped).sort();
        const values = labels.map(l => {
          const arr = grouped[l];
          return arr.reduce((a, b) => a + b, 0) / arr.length;
        });

        setChartData({
          labels,
          datasets: [
            {
              label: `PM2.5 History (${city})`,
              data: values,
              borderColor: "#6366f1",
              backgroundColor: "rgba(99, 102, 241, 0.3)",
              fill: true,
              tension: 0.3,
              borderWidth: 2,
            },
          ],
        });
      } catch (err) {
        console.error("History fetch error:", err);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [city, days]); // Re-fetch when global city changes

  // ---------------------------
  // UI + GRAPH COMPONENT
  // ---------------------------
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-primary mb-6">AQI History</h1>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        {/* CITY SELECTOR */}
        <div>
          <label className="text-secondary text-sm">City</label>
          <select
            className="
              w-full p-2 mt-2 rounded-lg border
              bg-[var(--card)] text-primary
              border-gray-700 dark:border-gray-300
            "
            value={city} // Use global city
            onChange={(e) => setCity(e.target.value)} // Set global city
          >
            <option>Delhi</option>
            <option>Mumbai</option>
            <option>Bengaluru</option>
            <option>Hyderabad</option>
            <option>Chennai</option>
            <option>Kolkata</option>
          </select>
        </div>

        {/* TIME RANGE */}
        <div>
          <label className="text-secondary text-sm">Time Range</label>
          <select
            className="
              w-full p-2 mt-2 rounded-lg border
              bg-[var(--card)] text-primary
              border-gray-700 dark:border-gray-300
            "
            value={days}
            onChange={(e) => setDays(e.target.value)}
          >
            <option value={1}>Past 24 Hours</option>
            <option value={3}>Past 3 Days</option>
            <option value={7}>Past 7 Days</option>
            <option value={30}>Past 30 Days</option>
          </select>
        </div>
      </div>

      {/* GRAPH CARD */}
      <div
        className="
          p-6 rounded-2xl shadow-md border
          bg-[var(--card)] text-primary
          border-gray-700 dark:border-gray-300
        "
      >
        {loading ? (
          <p className="text-secondary text-center py-8">Loading data...</p>
        ) : chartData ? (
          <Line data={chartData} height={120} />
        ) : (
          <p className="text-secondary">No data available</p>
        )}
      </div>
    </div>
  );
}