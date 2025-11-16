import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import L from "leaflet";

export default function Heatmap() {
  const wrapperRef = useRef(null);
  const mapRef = useRef(null);
  const [isExpanded, setExpanded] = useState(false);
  const [topOffset, setTopOffset] = useState(0);

  // -------------------------
  // 🔥 REAL HEATMAP DATA FROM BACKEND
  // -------------------------
  const [heatPoints, setHeatPoints] = useState([]);
  const [loadingMap, setLoadingMap] = useState(true);

  const fetchHeatmap = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/heatmap?city=Delhi&days=1");
      const data = await res.json();

      const converted = data.features
        .filter((f) => f.geometry?.coordinates)
        .map((f) => {
          const [lng, lat] = f.geometry.coordinates;
          const pm25 = f.properties.pm25 || 0;
          return [lat, lng, pm25 / 500]; // Normalize PM2.5 → Leaflet heat intensity
        });

      setHeatPoints(converted);
      setLoadingMap(false);
    } catch (err) {
      console.error("Heatmap fetch error:", err);
      setLoadingMap(false);
    }
  };

  useEffect(() => {
    fetchHeatmap();
    const interval = setInterval(fetchHeatmap, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  // ---------------------------
  // Dark / Light theme detector
  // ---------------------------
  const getTheme = () =>
    document.documentElement.classList.contains("dark") ? "dark" : "light";

  const theme = getTheme();

  // ---------------------------
  // Fullscreen toggle
  // ---------------------------
  const toggleExpand = () => {
    if (!isExpanded) {
      const rectTop = wrapperRef.current?.getBoundingClientRect().top ?? 0;
      setTopOffset(rectTop);
    }
    setExpanded((prev) => !prev);

    // fix leaflet render only AFTER animation
    setTimeout(() => {
      const map = mapRef.current;
      if (map) {
        map.invalidateSize();
      }
    }, 250);
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full ${isExpanded ? "z-1200" : "z-10"}`}
      style={{ height: isExpanded ? "100vh" : "55vh" }}
    >
      {/* FULLSCREEN BUTTON */}
      <button
        onClick={toggleExpand}
        className="
          absolute top-4 right-4 z-2000
          bg-white dark:bg-(--card)
          border border-gray-300 dark:border-gray-700
          px-3 py-2 rounded-md shadow-lg text-sm font-semibold
          hover:bg-gray-100 dark:hover:bg-gray-800 transition
        "
      >
        {isExpanded ? "Exit Fullscreen ✕" : "Fullscreen ⤢"}
      </button>

      {/* MAP CONTAINER */}
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
          {/* THEME TILESET */}
          {theme === "dark" ? (
            <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png" />
          ) : (
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          )}

          {/* 🔥 REAL HEATMAP */}
          {!loadingMap && <HeatLayer points={heatPoints} />}

          {/* Static AQI Markers (kept unchanged for styling) */}
          <AQIMarkers
            markers={[
              { lat: 28.65, lng: 77.32, aqi: 290 },
              { lat: 28.72, lng: 77.12, aqi: 180 },
              { lat: 28.6, lng: 77.45, aqi: 340 },
            ]}
          />

          <ZoomButtons />
        </MapContainer>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* HeatLayer connected to backend data */
/* ---------------------------------------------------------------------- */
function HeatLayer({ points }) {
  const map = useMap();
  const heatRef = useRef(null);

  useEffect(() => {
    if (!map || !L.heatLayer) return;

    const heat = L.heatLayer(points, {
      radius: 28,
      blur: 22,
      maxZoom: 18,
      minOpacity: 0.35,
    });

    heat.addTo(map);
    heatRef.current = heat;

    return () => {
      if (heatRef.current) map.removeLayer(heatRef.current);
    };
  }, [map, points]);

  return null;
}

/* ---------------------------------------------------------------------- */
/* AQI Bubble Markers (unchanged design) */
/* ---------------------------------------------------------------------- */
function AQIMarkers({ markers }) {
  const map = useMap();
  const created = useRef([]);

  useEffect(() => {
    if (!map) return;

    created.current.forEach((m) => map.removeLayer(m));
    created.current = [];

    markers.forEach(({ lat, lng, aqi }) => {
      const html = `
        <div style="
          background:${getAQIColor(aqi)};
          width:46px;height:46px;
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          color:white;
          font-weight:700;
          font-size:14px;
          box-shadow:0 2px 6px rgba(0,0,0,0.25);
        ">
          ${aqi}
        </div>
      `;
      const icon = L.divIcon({ className: "", html, iconSize: [46, 46] });
      const marker = L.marker([lat, lng], { icon }).addTo(map);
      created.current.push(marker);
    });

    return () => {
      created.current.forEach((m) => map.removeLayer(m));
      created.current = [];
    };
  }, [map, markers]);

  return null;
}

function getAQIColor(aqi) {
  if (aqi <= 50) return "#10b981";
  if (aqi <= 100) return "#f59e0b";
  if (aqi <= 200) return "#f97316";
  if (aqi <= 300) return "#ef4444";
  return "#7c3aed";
}

/* ---------------------------------------------------------------------- */
/* ZOOM BUTTONS (unchanged) */
/* ---------------------------------------------------------------------- */
function ZoomButtons() {
  const map = useMap();

  return (
    <div className="absolute bottom-6 right-6 z-1500 flex flex-col gap-2 pointer-events-none">
      <button
        onClick={() => map.zoomIn()}
        className="pointer-events-auto w-10 h-10 bg-white dark:bg-(--card) rounded-md shadow text-xl"
      >
        +
      </button>

      <button
        onClick={() => map.zoomOut()}
        className="pointer-events-auto w-10 h-10 bg-white dark:bg-(--card) rounded-md shadow text-xl"
      >
        −
      </button>
    </div>
  );
}
