// src/components/Heatmap.jsx
import React, { useEffect, useRef, useState, useContext } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import L from "leaflet";
import { ThemeContext } from "../context/ThemeContext";

/* ---------------------------------------------------------------
  CITY CENTERS
---------------------------------------------------------------- */
const CITY_CENTERS = {
  Delhi: [28.7041, 77.1025],
  Mumbai: [19.076, 72.8777],
  Bengaluru: [12.9716, 77.5946],
  Hyderabad: [17.385, 78.4867],
  Chennai: [13.0827, 80.2707],
  Kolkata: [22.5726, 88.3639],
};
const DEFAULT_ZOOM = 11;

/* ---------------------------------------------------------------
  AQI COLOR CATEGORIES (INDIAN STANDARD)
---------------------------------------------------------------- */
const AQI_COLORS = {
  good: "#00E400",       // Deep Green
  moderate: "#F0D400",   // Yellow
  poor: "#F07554",       // Orange
  unhealthy: "#F54E8E",
  severe: "#8F3F97",     // Maroon
  hazardous: "#7E0023"
};

// 🔥 NEW: Indian Standard PM2.5 -> AQI Conversion
function pm25ToAQI(pm25) {
  if (pm25 === null || pm25 === undefined || isNaN(parseFloat(pm25))) return 0;
  const pm = parseFloat(pm25);
  
  if (pm <= 30) return Math.round((50 / 30) * pm);
  if (pm <= 60) return Math.round(((100 - 51) / (60 - 30)) * (pm - 30) + 51);
  if (pm <= 90) return Math.round(((200 - 101) / (90 - 60)) * (pm - 60) + 101);
  if (pm <= 120) return Math.round(((300 - 201) / (120 - 90)) * (pm - 90) + 201);
  if (pm <= 250) return Math.round(((400 - 301) / (250 - 120)) * (pm - 120) + 301);
  if (pm > 250) return Math.round(((500 - 401) / (380 - 250)) * (pm - 250) + 401);
  
  return 500;
}

function getAqiSize(aqi) {
  // Updated thresholds based on AQI scale (0-500)
  if (aqi <= 50) return 32;     
  if (aqi <= 100) return 38;    
  if (aqi <= 200) return 44;    
  if (aqi <= 300) return 50;    
  if (aqi <= 400) return 56;    
  return 64;                    
}

function getAqiCategory(aqi) {
  // Updated categories based on Indian AQI
  if (aqi <= 50) return ["Good", AQI_COLORS.good];
  if (aqi <= 100) return ["Moderate", AQI_COLORS.moderate];
  if (aqi <= 200) return ["Poor", AQI_COLORS.poor];
  if (aqi <= 300) return ["Unhealthy", AQI_COLORS.unhealthy];
  if (aqi <= 400) return ["Severe", AQI_COLORS.severe];
  return ["Hazardous", AQI_COLORS.hazardous];
}

/* ---------------------------------------------------------------
  MAIN HEATMAP + BUBBLE MAP COMPONENT
---------------------------------------------------------------- */
export default function Heatmap() {
  const { city } = useContext(ThemeContext);
  const wrapperRef = useRef(null);
  const mapRef = useRef(null);

  const [isExpanded, setExpanded] = useState(false);
  const [topOffset, setTopOffset] = useState(0);

  const [heatPoints, setHeatPoints] = useState([]);
  const [loadingMap, setLoadingMap] = useState(true);

  /* ---------------- FETCH SPATIAL AQI WITH FE CACHE ---------------- */
  const CACHE_KEY = "heatmap_cache_v1";

  const fetchHeatmap = async (currentCity) => {
    setLoadingMap(true);

    // Try reading FE cache
    const cacheRaw = localStorage.getItem(CACHE_KEY);
    if (cacheRaw) {
      const cache = JSON.parse(cacheRaw);
      const entry = cache[currentCity];

      if (entry) {
        const age = (Date.now() - entry.timestamp) / 1000;

        // cache valid for 15 minutes
        if (age < 15 * 60) {
          console.log(`[FE Cache] Using cached heatmap for ${currentCity}`);
          setHeatPoints(entry.data);
          setLoadingMap(false);
          return;
        }
      }
    }

    // No cache → request backend
    try {
      console.log(`[FE Cache] Fetching new data for ${currentCity}…`);
      // NOTE: This is a hardcoded URL, you should update this to use your api.js library
      const res = await fetch(
        `http://127.0.0.1:8000/spatial_heatmap?city=${currentCity}`
      );
      if (!res.ok) throw new Error(`API Error: ${res.status}`);

      const data = await res.json();

      setHeatPoints(data.points);

      // Save to FE cache
      const newCache = cacheRaw ? JSON.parse(cacheRaw) : {};
      newCache[currentCity] = {
        timestamp: Date.now(),
        data: data.points,
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
    } catch (e) {
      console.error("Heatmap fetch error:", e);
      setHeatPoints([]);
    } finally {
      setLoadingMap(false);
    }
  };


  useEffect(() => {
    if (!city) return;

    fetchHeatmap(city);
  }, [city]);

  useEffect(() => {
    if (mapRef.current)
      mapRef.current.setView(CITY_CENTERS[city], DEFAULT_ZOOM);
  }, [city]);

  /* ---------------- FULLSCREEN TOGGLE ---------------- */
  const toggleExpand = () => {
    if (!isExpanded) {
      const rectTop = wrapperRef.current?.getBoundingClientRect().top ?? 0;
      setTopOffset(rectTop);
    }
    setExpanded((prev) => !prev);

    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 300);
  };

  const theme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";

    // pick evenly distributed bubble markers
  function pickEvenly(points, count = 20) {
    if (points.length <= count) return points;
    const step = Math.floor(points.length / count);
    let selected = [];
    for (let i = 0; i < points.length; i += step) {
      selected.push(points[i]);
    }
    return selected.slice(0, count);
  }
  const bubblePoints = pickEvenly(heatPoints, 10);

  /* ------------------ UI + MAP RENDER ------------------- */
  return (
    <div
      ref={wrapperRef}
      className={`relative w-full transition-all duration-300 ${
        isExpanded ? "z-1200" : "z-10"
      }`}
      style={{
        height: isExpanded ? "100vh" : "40vh",
        borderRadius: "0px",

        overflow: "hidden",
      }}
    >
      {/* Fullscreen Button */}
      <button
        onClick={toggleExpand}
        className="
          absolute top-4 right-4 z-2000
          px-4 py-2 text-sm font-semibold rounded-xl
          backdrop-blur-md shadow-lg
          bg-[var(--card)]/80 text-primary
          border border-gray-700 dark:border-gray-300
          hover:scale-103
          transition-transform hover:cursor-pointer
        "
      >
        {isExpanded ? "Exit Fullscreen ✕" : "Fullscreen ⤢"}
      </button>

      <div
        className={`transition-all duration-300 ${
          isExpanded ? "fixed inset-0" : "relative w-full h-full"
        }`}
        style={
          isExpanded
            ? {
                top: topOffset,
                height: `calc(100vh - ${topOffset}px)`,
                background: "var(--bg)", 
              }
            : {}
        }
      >
        <MapContainer
          center={CITY_CENTERS[city]}
          zoom={DEFAULT_ZOOM}
          zoomControl={false}
          ref={mapRef}
          style={{ width: "100%", height: "100%" }}
        >
          {/* Light & Dark Tile Layers */}
          {theme === "dark" ? (
            <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png" />
          ) : (
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          )}

          

          {/* 🔥 AQI BUBBLE MARKERS (20 evenly spaced) */}
          {!loadingMap && bubblePoints.map((p, i) => <AQIMarker key={i} point={p} />)}

          <ZoomButtons />
        </MapContainer>

        {/* SHIMMER LOADER */}
        {loadingMap && (
          <div className="absolute inset-0 z-1500 bg-black/20 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center animate-pulse">
            <div className="h-10 w-10 rounded-full border-4 border-gray-300 border-t-transparent animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}



/* ---------------------------------------------------------------
  AQI BUBBLE MARKERS (CLICKABLE)
---------------------------------------------------------------- */
function AQIMarker({ point }) {
  const map = useMap();
  const [lat, lon, pm] = point; // pm is raw PM2.5

  // 🔥 CONVERT PM2.5 TO AQI
  const aqi = pm25ToAQI(pm);

  const [category, color] = getAqiCategory(aqi);
  const size = getAqiSize(aqi);         // ⭐ dynamic size based on AQI
  const radius = size / 2;

  const icon = L.divIcon({
    className: "aqi-marker",
    html: `
      <div style="
        background:${color};
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        display:flex;
        justify-content:center;
        align-items:center;
        font-size:${Math.max(12, size / 3)}px;
        font-weight:700;
        color:black; /* Improved text contrast for lighter Indian colors */
        box-shadow:0 0 12px rgba(0,0,0,0.25);
      ">
        ${Math.round(aqi)}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [radius, radius],
  });

  useEffect(() => {
    const marker = L.marker([lat, lon], { icon }).addTo(map);

    marker.bindPopup(`
      <div>
        <h4 style="font-weight:bold;margin-bottom:6px;">AQI: ${aqi}</h4>
        <p><strong>Category:</strong> ${category}</p>
        <p style="margin-top:4px; font-size:11px; color:#666;">PM2.5: ${Math.round(pm)} µg/m³</p>
        <p><strong>Latitude:</strong> ${lat.toFixed(4)}</p>
        <p><strong>Longitude:</strong> ${lon.toFixed(4)}</p>
      </div>
    `);

    return () => map.removeLayer(marker);
  }, []);

  return null;
}


/* ---------------------------------------------------------------
  ZOOM BUTTONS
---------------------------------------------------------------- */
function ZoomButtons() {
  const map = useMap();

  return (
    <div className="absolute bottom-6 right-6 z-1500 flex flex-col gap-3">
      <button
        onClick={() => map.zoomIn()}
        className="
          w-10 h-10 rounded-xl bg-[var(--card)]/80 backdrop-blur text-primary
          shadow-md text-xl hover:scale-105 transition-transform hover:cursor-pointer
          border border-gray-700 dark:border-gray-300
        "
      >
        +
      </button>

      <button
        onClick={() => map.zoomOut()}
        className="
          w-10 h-10 rounded-xl bg-[var(--card)]/80 backdrop-blur text-primary
          shadow-md text-xl hover:scale-105 transition-transform hover:cursor-pointer
          border border-gray-700 dark:border-gray-300
        "
      >
        –
      </button>
    </div>
  );
}