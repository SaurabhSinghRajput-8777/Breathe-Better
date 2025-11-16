// src/components/ForecastCard.jsx
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler, 
} from "chart.js";
import { getPredict } from "../lib/api"; 

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler 
);

export default function ForecastCard({ city, hours = 24 }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      setLoading(true);
      setChartData(null); // Clear old data
      try {
        // This 'getPredict' call is now returning your successful JSON
        const data = await getPredict(city, hours);
        
        // This 'if' block will now PASS
        if (data && data.predictions && data.predictions.length > 0) {
          const labels = data.predictions.map(p => {
            const dt = new Date(p.datetime);
            return dt.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
          });
          const values = data.predictions.map(p => p.pm25); // This will be [119.4, 100.6, ...]

          setChartData({
            labels: labels,
            datasets: [
              {
                label: `PM2.5 Forecast (${city})`,
                data: values,
                borderColor: "#6366f1", // Indigo
                backgroundColor: "rgba(99, 102, 241, 0.3)", // Transparent Indigo
                fill: true,
                tension: 0.3,
                borderWidth: 2,
                pointRadius: 0, 
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
  }, [city, hours]); 

  const options = {
    responsive: true,
    maintainAspectRatio: false, 
    plugins: {
      legend: {
        display: false, 
      },
    },
    scales: {
      x: {
        grid: {
          display: false, 
        },
        ticks: {
          color: "var(--text-secondary)", 
        }
      },
      y: {
        grid: {
          color: "rgba(150, 150, 170, 0.1)", 
        },
        ticks: {
          color: "var(--text-secondary)", 
        }
      }
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto mt-6 px-4 md:px-6">
      <div
        className="
          p-6 rounded-2xl shadow-md border
          bg-(--card) text-primary
          border-gray-300 dark:border-gray-700
        "
      >
        <h2 className="text-xl font-semibold text-primary mb-4">Hourly Forecast ({hours}h)</h2>
        <div style={{ height: '250px' }}> 
          {loading ? (
            <p className="text-secondary text-center pt-16">Loading forecast...</p>
          ) : chartData ? (
            // This will now render
            <Line data={chartData} options={options} />
          ) : (
            <p className="text-secondary text-center pt-16">No prediction data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}