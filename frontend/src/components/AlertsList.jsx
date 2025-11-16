// src/components/AlertsList.jsx
import React from "react";

/**
 * timeline: array of { ts, city, pm25 (or aqi), category }
 */
export default function AlertsList({ timeline = [] }) {
  return (
    <div className="rounded-lg p-4 border bg-(--card)">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">Recent Alerts</h3>
        <div className="text-sm text-secondary">{timeline.length} events</div>
      </div>

      {timeline.length === 0 ? (
        <div className="py-8 text-center text-secondary">No alert events yet — system is calm.</div>
      ) : (
        <ul className="space-y-3">
          {timeline.map((ev, idx) => (
            <li
              key={idx}
              className="p-3 rounded-md flex items-start justify-between border bg-transparent"
              style={{ borderColor: "rgba(150,150,170,0.04)" }}
            >
              <div>
                <div className="text-sm text-secondary">
                  {ev.city} •{" "}
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                    {ev.category || ""}
                  </span>
                </div>
                <div className="text-sm">
                  <b>{ev.pm25 ?? ev.aqi ?? "—"}</b>{" "}
                  <span className="text-xs text-secondary">PM2.5</span>
                </div>
                <div className="text-xs text-secondary mt-1">{new Date(ev.ts).toLocaleString()}</div>
              </div>

              <div className="text-right text-xs">
                <div
                  className="inline-block px-2 py-1 rounded-md font-semibold"
                  style={{
                    background: ev.pm25 >= 300 ? "#9b2c2c" : ev.pm25 >= 200 ? "#c2410c" : "#047857",
                    color: "white",
                  }}
                >
                  {ev.pm25 ? Math.round(ev.pm25) : "N/A"}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
