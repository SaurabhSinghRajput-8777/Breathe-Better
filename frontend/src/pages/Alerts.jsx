// src/pages/Alerts.jsx
import React, { useEffect, useState } from "react";
import AlertsList from "../components/AlertsList";

/**
 * Alerts page
 * - Polls /current_aqi every 30s (configurable)
 * - Shows a high-priority banner when AQI category is Unhealthy/Severe/Hazardous
 * - Keeps a small timeline of recent alert events (in-memory)
 * - Allows setting a threshold (AQI numeric) to create a custom client-side alert
 * - Simple "subscribe" form (mock) — if you have a backend route for subscriptions you can replace the handler
 */
export default function Alerts() {
  const [city, setCity] = useState("Delhi");
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState([]); // {ts, city, aqi, category}
  const [threshold, setThreshold] = useState(200);
  const [subEmail, setSubEmail] = useState("");
  const [subMsg, setSubMsg] = useState("");

  const IMPORTANT_CATEGORIES = ["Unhealthy", "Very Unhealthy", "Severe", "Hazardous"];

  // fetch current aqi once, and then poll
  useEffect(() => {
    let mounted = true;
    let timer = null;

    async function fetchCurrent() {
      setLoading(true);
      try {
        const res = await fetch(`/current_aqi?city=${encodeURIComponent(city)}`);
        const data = await res.json();
        if (!mounted) return;
        // data expected: { city, pm25, datetime, category, color }
        setCurrent(data);

        // if important, add to timeline
        if (data && IMPORTANT_CATEGORIES.includes(data.category)) {
          setTimeline(prev => {
            const next = [{ ts: new Date(), ...data }, ...prev].slice(0, 20);
            return next;
          });
        }

        // also trigger if above numeric threshold (if available)
        if (data.pm25 && +data.pm25 >= +threshold) {
          setTimeline(prev => {
            const next = [
              {
                ts: new Date(),
                city: data.city,
                aqi: data.pm25,
                category: `Above threshold (${threshold})`,
              },
              ...prev,
            ].slice(0, 20);
            return next;
          });
        }
      } catch (err) {
        console.error("Failed to fetch current_aqi:", err);
      }
      setLoading(false);
    }

    fetchCurrent();
    // poll every 30s
    timer = setInterval(fetchCurrent, 30000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [city, threshold]);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!subEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setSubMsg("Please enter a valid email.");
      return;
    }

    // mock subscription - replace with a real API call if you have one.
    // e.g. POST /alerts/subscribe { email, city, threshold }
    setSubMsg("Subscribing...");
    setTimeout(() => {
      setSubMsg(`Subscribed ${subEmail} for ${city} alerts (threshold ${threshold}).`);
      setSubEmail("");
      setTimeout(() => setSubMsg(""), 5000);
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-primary">Alerts</h1>

        <div className="flex items-center gap-3">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="p-2 rounded-md border bg-(--card) text-primary border-gray-300 dark:border-gray-700"
          >
            <option>Delhi</option>
            <option>Mumbai</option>
            <option>Bengaluru</option>
            <option>Hyderabad</option>
            <option>Chennai</option>
            <option>Kolkata</option>
          </select>
        </div>
      </div>

      {/* ALERT BANNER */}
      {current && IMPORTANT_CATEGORIES.includes(current.category) && (
        <div
          className="rounded-lg p-4 mb-6 flex items-start gap-4 shadow-md"
          style={{ background: "linear-gradient(90deg,#ff5f6d,#ffc371)", color: "white" }}
        >
          <div className="text-xl font-bold">⚠️ High Pollution Alert</div>
          <div className="text-sm opacity-95">
            {city} — AQI status: <b>{current.category}</b> • PM2.5: <b>{current.pm25}</b> • Updated:{" "}
            <span className="underline">{current.datetime}</span>
          </div>
        </div>
      )}

      {/* CURRENT SUMMARY CARD */}
      <div
        className="p-6 rounded-2xl mb-6 border shadow-sm bg-(--card)"
        style={{ borderColor: "rgba(150,150,170,0.06)" }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm text-secondary">Live AQI</div>
            <div className="flex items-baseline gap-4">
              <div className="text-5xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                {current ? current.pm25 : loading ? "..." : "N/A"}
              </div>
              <div className="text-sm text-secondary">
                {current ? (
                  <>
                    <div>{current.category}</div>
                    <div className="text-xs">{current.city} • {current.datetime}</div>
                  </>
                ) : (
                  <div>Data not available</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm text-secondary mr-2">Alert threshold (PM2.5)</label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-28 p-2 rounded-md border bg-(--card) text-primary border-gray-300 dark:border-gray-700"
            />
          </div>
        </div>
      </div>

      {/* SUBSCRIBE */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <form onSubmit={handleSubscribe} className="p-4 rounded-lg border bg-(--card)">
          <div className="text-sm text-secondary mb-2">Subscribe to alerts</div>
          <div className="flex gap-2">
            <input
              value={subEmail}
              onChange={(e) => setSubEmail(e.target.value)}
              placeholder="you@domain.com"
              className="p-2 rounded-md flex-1 border bg-transparent border-gray-300 dark:border-gray-700 text-primary"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Subscribe
            </button>
          </div>
          {subMsg && <div className="mt-2 text-sm text-secondary">{subMsg}</div>}
        </form>

        <div className="p-4 rounded-lg border bg-(--card)">
          <div className="text-sm text-secondary mb-2">Quick actions</div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                // manual check + add timeline
                if (current) {
                  setTimeline(prev => [{ ts: new Date(), ...current }, ...prev].slice(0, 20));
                }
              }}
              className="px-3 py-2 rounded-md border bg-white/5 hover:bg-white/10"
            >
              Save current as alert
            </button>

            <button
              onClick={() => {
                setTimeline([]);
              }}
              className="px-3 py-2 rounded-md border bg-white/5 hover:bg-white/10"
            >
              Clear timeline
            </button>
          </div>
        </div>
      </div>

      {/* Timeline / Alert List */}
      <AlertsList timeline={timeline} />
    </div>
  );
}
