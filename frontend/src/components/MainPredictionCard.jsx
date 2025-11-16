import React from "react";

export default function MainPredictionCard({ pred }) {
  const use = pred || {
    aqi: 145,
    category: "Unhealthy",
    pm25: 110,
    pm10: 180,
    weather: { temp: 28, icon: "🌤️" }
  };

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
          <div>
            <p className="font-bold text-secondary">Prediction (24h)</p>

            <div className="mt-3 flex items-center gap-6">
              <div>
                <div className="text-6xl font-extrabold text-indigo-700 dark:text-indigo-700">
                  {use.aqi}
                </div>

                <div className="
                  mt-2 inline-block px-3 py-1 rounded-full text-sm
                  font-semibold text-primary
                  
                ">
                  {use.category}
                </div>
              </div>
            </div>

            <div className="mt-5 text-sm text-secondary">
              PM2.5: <b>{use.pm25} µg/m³</b> • PM10: <b>{use.pm10} µg/m³</b>
            </div>
          </div>

          <div className="md:col-span-2 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-4xl">{use.weather.icon}</div>
              <div>
                <p className="text-sm text-secondary">Tomorrow</p>
                <p className="text-xl font-semibold text-primary">{use.weather.temp}°C</p>
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
