import React, { useState } from "react";

export default function Reports() {
  const [city, setCity] = useState("Delhi");
  const [days, setDays] = useState(7);

  const generatePDF = () => {
    const url = `http://127.0.0.1:8000/report/pdf?city=${city}&days=${days}`;
    window.open(url, "_blank");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-primary mb-6">Reports</h1>

      <div
        className="
        p-6 rounded-2xl border shadow-md
        bg-[var(--card)] border-gray-300 dark:border-gray-700
      "
      >
        <h2 className="text-xl font-semibold text-primary mb-4">Generate PDF Report</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CITY SELECT */}
          <div>
            <label className="text-secondary text-sm">Select City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="
                w-full mt-2 p-2 rounded-lg border
                bg-[var(--card)] text-primary
                border-gray-300 dark:border-gray-700
              "
            >
              <option>Delhi</option>
              <option>Mumbai</option>
              <option>Bengaluru</option>
              <option>Hyderabad</option>
              <option>Chennai</option>
              <option>Kolkata</option>
            </select>
          </div>

          {/* DAYS INPUT */}
          <div>
            <label className="text-secondary text-sm">Past Days</label>
            <input
              type="number"
              value={days}
              min={1}
              max={30}
              onChange={(e) => setDays(e.target.value)}
              className="
                w-full mt-2 p-2 rounded-lg border
                bg-[var(--card)] text-primary
                border-gray-300 dark:border-gray-700
              "
            />
          </div>
        </div>

        <button
          onClick={generatePDF}
          className="
            mt-6 w-full py-3 rounded-lg font-semibold
            bg-indigo-600 hover:bg-indigo-700 text-white
            transition
          "
        >
          Download Report PDF
        </button>
      </div>
    </div>
  );
}
