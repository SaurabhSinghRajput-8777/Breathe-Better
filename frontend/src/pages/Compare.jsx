// src/pages/Compare.jsx
import React, { useState } from "react";
import axios from "axios";
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

export default function Compare() {
  const [cityA, setCityA] = useState("Delhi");
  const [cityB, setCityB] = useState("Mumbai");

  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);

  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [respA, respB] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/predict?city=${cityA}&duration_hours=24`),
        axios.get(`http://127.0.0.1:8000/predict?city=${cityB}&duration_hours=24`),
      ]);

      setDataA(respA.data?.predictions || []);
      setDataB(respB.data?.predictions || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    }

    setLoading(false);
  };

  const graphData = {
    labels: dataA?.map((item) => item.hour_index) || [],
    datasets: [
      {
        label: cityA,
        data: dataA?.map((item) => item.pm25),
        borderColor: "#4F46E5", // Indigo
        tension: 0.3,
      },
      {
        label: cityB,
        data: dataB?.map((item) => item.pm25),
        borderColor: "#EC4899", // Pink
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 text-primary">
      <h1 className="text-3xl font-bold mb-6">Compare Air Quality</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Graph */}
      <div className="mt-10 p-6 rounded-2xl bg-white dark:bg-(--card) shadow border border-gray-200 dark:border-gray-700">
        {loading && <p className="text-secondary">Loading data...</p>}

        {!loading && dataA && dataB ? (
          <Line data={graphData} />
        ) : (
          <p className="text-secondary">Select cities and click Compare.</p>
        )}
      </div>

      {/* Summary Box */}
      {dataA && dataB && (
        <div className="mt-8 p-6 rounded-2xl bg-white dark:bg-(--card) shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Summary</h2>

          <p className="text-secondary">
            Avg PM2.5 in {cityA}:{" "}
            <b>
              {(
                dataA.reduce((a, b) => a + b.pm25, 0) / dataA.length
              ).toFixed(1)}
            </b>
          </p>

          <p className="text-secondary">
            Avg PM2.5 in {cityB}:{" "}
            <b>
              {(
                dataB.reduce((a, b) => a + b.pm25, 0) / dataB.length
              ).toFixed(1)}
            </b>
          </p>

          <hr className="my-3 border-gray-300 dark:border-gray-700" />

          <p className="text-primary font-semibold">
            {
              (dataA.reduce((a, b) => a + b.pm25, 0) / dataA.length <
              dataB.reduce((a, b) => a + b.pm25, 0) / dataB.length)
                ? `${cityA} has cleaner air right now.`
                : `${cityB} has cleaner air right now.`
            }
          </p>
        </div>
      )}
    </div>
  );
}
