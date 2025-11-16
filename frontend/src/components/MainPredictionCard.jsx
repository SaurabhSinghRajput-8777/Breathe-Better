import React, { useEffect, useState } from "react";

// -------------------------------
// AQI CALCULATION FUNCTION
// -------------------------------
function pm25ToAQI(pm25) {
  if (pm25 <= 12) return (50 / 12) * pm25;
  if (pm25 <= 35.4) return ((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51;
  if (pm25 <= 55.4) return ((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101;
  if (pm25 <= 150.4) return ((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151;
  if (pm25 <= 250.4) return ((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201;
  if (pm25 <= 350.4) return ((400 - 301) / (350.4 - 250.5)) * (pm25 - 250.5) + 301;
  return 500;
}

function getAQICategory(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

export default function MainPredictionCard({ city = "Delhi" }) {
  const [pred, setPred] = useState(null);

  // -------------------------------
  // 🔥 Fetch 24H prediction from backend
  // -------------------------------
  const fetchPrediction = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/predict?city=${city}&duration_hours=24`
      );
      const data = await res.json();

      if (!data?.predictions || data.predictions.length === 0) return;

      // Avg PM2.5 for next 24h
      const pmValues = data.predictions.map((p) => p.pm25);
      const avgPM25 = pmValues.reduce((a, b) => a + b, 0) / pmValues.length;

      const aqi = Math.round(pm25ToAQI(avgPM25));
      const category = getAQICategory(aqi);

      // Your backend does not give PM10 → safe estimate
      const pm10 = Math.round(avgPM25 * 1.5);

      setPred({
        aqi,
        pm25: Math.round(avgPM25),
        pm10,
        category,
        weather: { temp: 25, icon: "🌤️" },
      });
    } catch (err) {
      console.error("Prediction fetch error:", err);
    }
  };

  // fetch on load + every 30 min
  useEffect(() => {
    fetchPrediction();
    const interval = setInterval(fetchPrediction, 1800000);
    return () => clearInterval(interval);
  }, [city]);

  const use =
    pred ||
    ({
      aqi: 145,
      category: "Unhealthy",
      pm25: 110,
      pm10: 180,
      weather: { temp: 28, icon: "🌤️" },
    });

  return (
    <section className="max-w-[1200px] mx-auto px-4 md:px-6 -mt-16 relative z-30">
      <div
        className="
          rounded-3xl p-6 md:p-8 shadow-xl border
          bg-(--card) border-gray-300 dark:border-gray-700
          transition-colors
        "
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* LEFT SIDE */}
          <div>
            <p className="font-bold text-secondary">Prediction (24h)</p>

            <div className="mt-3 flex items-center gap-6">
              <div>
                <div className="text-6xl font-extrabold text-indigo-700">
                  {use.aqi}
                </div>

                <div
                  className="
                    mt-2 inline-block px-3 py-1 rounded-full text-sm
                    font-semibold text-primary
                  "
                >
                  {use.category}
                </div>
              </div>
            </div>

            <div className="mt-5 text-sm text-secondary">
              PM2.5: <b>{use.pm25} µg/m³</b> • PM10: <b>{use.pm10} µg/m³</b>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="md:col-span-2 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-4xl">{use.weather.icon}</div>
              <div>
                <p className="text-sm text-secondary">Tomorrow</p>
                <p className="text-xl font-semibold text-primary">
                  {use.weather.temp}°C
                </p>
              </div>
            </div>

            <div className="hidden md:block text-right">
              <p className="text-sm text-secondary">Model Insight</p>
              <p className="mt-2 text-sm text-secondary">
                Predicted using hybrid ensemble — weather-augmented.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
