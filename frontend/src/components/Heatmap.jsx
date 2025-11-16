import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import L from "leaflet";

/**
 * Heatmap.jsx
 * - Uses document.documentElement.classList.contains('dark') as theme source (robust fallback)
 * - Fixed Tailwind invalid classes (use bracket-syntax for CSS vars)
 * - Fixed z-index classes to z-[...]
 * - Added cleanup for markers
 * - Ensures map.invalidateSize() when toggling fullscreen
 */

export default function Heatmap() {
  const wrapperRef = useRef(null);
  const mapRef = useRef(null);
  const [isExpanded, setExpanded] = useState(false);
  const [topOffset, setTopOffset] = useState(0);

  // Samples
  const samplePoints = [
    [28.6692, 77.4538, 0.6],
    [28.7041, 77.1025, 0.7],
    [28.5355, 77.391, 0.4],
  ];

  const aqiMarkers = [
    { lat: 28.65, lng: 77.32, aqi: 290 },
    { lat: 28.72, lng: 77.12, aqi: 180 },
    { lat: 28.60, lng: 77.45, aqi: 340 },
  ];

  // Read theme from document <html> as fallback (works even if context import fails)
  const getTheme = () =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";

  const theme = getTheme();

  const toggleExpand = () => {
    if (!isExpanded) {
      const top = wrapperRef.current?.getBoundingClientRect().top ?? 0;
      setTopOffset(top);
    }
    setExpanded((s) => !s);

    // Force Leaflet to redraw after animation completes
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
      const map = mapRef.current;
      if (map) {
        try {
          map.invalidateSize();
        } catch (e) {
          // ignore
        }
      }
    }, 260); // match transition duration (approx)
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full ${isExpanded ? "z-1200" : "z-10"}`}
      style={{
        height: isExpanded ? "100vh" : "55vh",
      }}
    >
      {/* FULLSCREEN BUTTON (same place for enter/exit) */}
      <button
        onClick={toggleExpand}
        className="
          absolute top-4 right-4 z-2000
          bg-white dark:bg-(--card)
          border border-gray-300 dark:border-gray-700
          px-3 py-2 rounded-md shadow-lg text-sm font-semibold
          hover:bg-gray-100 dark:hover:bg-gray-800 transition
        "
        aria-label={isExpanded ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isExpanded ? "Exit Fullscreen ✕" : "Fullscreen ⤢"}
      </button>

      {/* MAP AREA */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? "fixed left-0 right-0 bottom-0" : "relative w-full h-full"
        }`}
        style={
          isExpanded
            ? {
                top: topOffset,
                zIndex: 1200,
                height: `calc(100vh - ${topOffset}px)`,
                background: "var(--bg)",
              }
            : {}
        }
      >
        <MapContainer
          center={[28.6692, 77.4538]}
          zoom={11}
          zoomControl={false}
          whenCreated={(map) => (mapRef.current = map)}
          style={{ width: "100%", height: "100%" }}
        >
          {/* Tiles chosen based on theme (document-level) */}
          {theme === "dark" ? (
            <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png" />
          ) : (
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          )}

          <HeatLayer points={samplePoints} />

          <AQIMarkers markers={aqiMarkers} />

          <ZoomButtons />
        </MapContainer>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* HeatLayer: adds/removes heat layer safely */
/* ---------------------------------------------------------------------- */
function HeatLayer({ points }) {
  const map = useMap();
  const heatRef = useRef(null);

  useEffect(() => {
    if (!map || !L?.heatLayer) return;

    const heat = L.heatLayer(points, {
      radius: 25,
      blur: 20,
      maxZoom: 17,
      minOpacity: 0.35,
    });

    heat.addTo(map);
    heatRef.current = heat;

    return () => {
      if (heatRef.current) {
        try {
          map.removeLayer(heatRef.current);
        } catch (e) {}
      }
    };
  }, [map, points]);

  return null;
}

/* ---------------------------------------------------------------------- */
/* AQI bubble markers: create and clean up markers */
/* ---------------------------------------------------------------------- */
function AQIMarkers({ markers }) {
  const map = useMap();
  const created = useRef([]);

  useEffect(() => {
    if (!map) return;

    // clear previous
    created.current.forEach((m) => {
      try {
        map.removeLayer(m);
      } catch (e) {}
    });
    created.current = [];

    markers.forEach((m) => {
      const color = getAQIColor(m.aqi);
      const html = `
        <div style="
          background: ${color};
          width:46px;height:46px;
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          color:white;
          font-weight:700;
          font-size:14px;
          box-shadow:0 2px 6px rgba(0,0,0,0.25);
          border: 2px solid rgba(255,255,255,0.08);
        ">
          ${m.aqi}
        </div>
      `;
      const bubble = L.divIcon({
        className: "",
        html,
        iconSize: [46, 46],
      });

      const marker = L.marker([m.lat, m.lng], { icon: bubble }).addTo(map);
      created.current.push(marker);
    });

    return () => {
      created.current.forEach((m) => {
        try {
          map.removeLayer(m);
        } catch (e) {}
      });
      created.current = [];
    };
  }, [map, markers]);

  return null;
}

function getAQIColor(aqi) {
  // simple color buckets
  if (aqi <= 50) return "#10b981"; // good - green
  if (aqi <= 100) return "#f59e0b"; // moderate - amber
  if (aqi <= 200) return "#f97316"; // unhealthy sensitive
  if (aqi <= 300) return "#ef4444"; // unhealthy
  return "#7c3aed"; // very unhealthy / hazardous
}

/* ---------------------------------------------------------------------- */
/* ZoomButtons: bottom-right fixed inside map container */
/* ---------------------------------------------------------------------- */
function ZoomButtons() {
  const map = useMap();

  // The element is rendered inside map container DOM, so absolute positioning works
  return (
    <div className="absolute bottom-6 right-6 z-1500 flex flex-col gap-2 pointer-events-none">
      <div className="pointer-events-auto">
        <button
          onClick={() => map.zoomIn()}
          className="w-10 h-10 bg-white dark:bg-(--card) rounded-md shadow text-xl flex items-center justify-center"
          title="Zoom In"
        >
          +
        </button>
      </div>

      <div className="pointer-events-auto">
        <button
          onClick={() => map.zoomOut()}
          className="w-10 h-10 bg-white dark:bg-(--card) rounded-md shadow text-xl flex items-center justify-center"
          title="Zoom Out"
        >
          −
        </button>
      </div>
    </div>
  );
}
