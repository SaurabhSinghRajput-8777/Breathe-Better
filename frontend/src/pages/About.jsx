import React from "react";

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-primary mb-6">About BreatheBetter</h1>

      <div
        className="
          p-6 rounded-2xl shadow-md border
          bg-(--card) text-primary
          border-gray-300 dark:border-gray-700
        "
      >
        <p className="text-lg text-secondary leading-relaxed">
          BreatheBetter is an AI-powered air quality forecasting system built using a
          hybrid ensemble model (XGBoost + Random Forest + Linear Regression).
        </p>

        <p className="mt-4 text-secondary leading-relaxed">
          It predicts PM2.5 levels, provides confidence intervals, visualizes past trends,
          and generates rich data reports — helping citizens, city planners, and health
          agencies make better decisions.
        </p>

        <p className="mt-4 text-secondary">
          Built by <span className="font-semibold text-primary">your team at Bennett University</span>.
        </p>
      </div>
    </div>
  );
}
