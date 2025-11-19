// src/components/PollutantCard.jsx
import React from "react";

const POLLUTANT_CONFIG = {
  "PM2.5": { color: "text-rose-500", bg: "bg-rose-500", border: "group-hover:border-rose-500/50", hex: "#f43f5e", max: 250 },
  "PM10":  { color: "text-orange-500", bg: "bg-orange-500", border: "group-hover:border-orange-500/50", hex: "#f97316", max: 300 },
  "NO2":   { color: "text-yellow-500", bg: "bg-yellow-500", border: "group-hover:border-yellow-500/50", hex: "#eab308", max: 200 },
  "SO2":   { color: "text-indigo-500", bg: "bg-indigo-500", border: "group-hover:border-indigo-500/50", hex: "#6366f1", max: 200 },
  "O3":    { color: "text-cyan-500", bg: "bg-cyan-500", border: "group-hover:border-cyan-500/50", hex: "#06b6d4", max: 180 },
  "CO":    { color: "text-emerald-500", bg: "bg-emerald-500", border: "group-hover:border-emerald-500/50", hex: "#10b981", max: 10000 },
  "default": { color: "text-gray-500", bg: "bg-gray-500", border: "group-hover:border-gray-500/50", hex: "#6b7280", max: 100 },
};

// Helper to render scientific names (e.g., NO2 -> NO₂)
const ChemicalName = ({ name }) => {
  if (name === "PM2.5") return <span className="tracking-tighter">PM<sub className="text-[0.65em] font-bold">2.5</sub></span>;
  if (name === "PM10") return <span className="tracking-tighter">PM<sub className="text-[0.65em] font-bold">10</sub></span>;
  if (name === "NO2") return <span className="tracking-tighter">NO<sub className="text-[0.65em] font-bold">2</sub></span>;
  if (name === "SO2") return <span className="tracking-tighter">SO<sub className="text-[0.65em] font-bold">2</sub></span>;
  if (name === "O3") return <span className="tracking-tighter">O<sub className="text-[0.65em] font-bold">3</sub></span>;
  return <span>{name}</span>;
};

export default function PollutantCard({ name, value, unit = "µg/m³", loading = false }) {
  const key = name.trim(); 
  const config = POLLUTANT_CONFIG[key] || POLLUTANT_CONFIG.default;

  const numericValue = parseFloat(value) || 0;
  const percentage = Math.min(Math.max((numericValue / config.max) * 100, 5), 100);

  if (loading) {
    return (
      <div className="h-36 rounded-3xl bg-[var(--card)] border border-[var(--card-border)] shadow-sm animate-pulse p-5 relative overflow-hidden">
        <div className="h-full w-full absolute top-0 left-0 bg-gradient-to-r from-transparent via-gray-100/5 dark:via-white/5 to-transparent translate-x-[-100%] animate-[shimmer_1.5s_infinite]"></div>
        <div className="flex justify-between items-center mb-6">
           <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700/50 rounded-xl"></div>
           <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700/50"></div>
        </div>
        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700/50 rounded mb-2"></div>
      </div>
    );
  }

  return (
    <div
      className="
        relative flex flex-col justify-between
        rounded-3xl p-5 
        bg-[var(--card)] 
        border border-[var(--card-border)]
        shadow-sm transition-all duration-300
        overflow-hidden
      "
      style={{
        // Uniform Gray Gradient for all cards
        //background: `linear-gradient(to bottom, var(--card) , #E8E8E8 150%)`
      }}
    >
      {/* 1. Ambient Glow Spot (Specific color preserved) */}
      <div 
        className="absolute -top-12 -left-12 w-32 h-32 rounded-full blur-3xl opacity-0"
        style={{ backgroundColor: config.hex }}
      />
      
      {/* Top Row: Chemical Badge */}
      <div className="flex justify-between items-start mb-3 z-10">
        <div className="
          px-3 py-1.5 rounded-xl text-sm font-bold 
          backdrop-blur-md shadow-sm border border-white/10
          flex items-center gap-1
        "
        style={{ 
          backgroundColor: `${config.hex}15`, 
          color: config.hex 
        }}>
          <ChemicalName name={name} />
        </div>

        {/* Limit Indicator */}
        <div className="text-[10px] font-medium text-secondary opacity-60 uppercase tracking-wider mt-1">
          Max: {config.max}
        </div>
      </div>

      {/* Middle Row: Big Value (Centered) */}
      {/* 🔥 FIX: Added 'justify-center' here */}
      <div className="flex items-baseline justify-center gap-1.5 z-10 mb-4">
        <span className="text-4xl font-extrabold text-primary tracking-tight opacity-95">
          {value ?? "--"}
        </span>
        <span className="text-sm font-bold text-secondary opacity-85">
          {unit}
        </span>
      </div>

      {/* Bottom Row: Enhanced Progress Bar */}
      <div className="relative z-10">
        <div className="flex justify-between text-[10px] font-semibold text-secondary mb-1.5 opacity-80">
          <span>Concentration</span>
          <span>{Math.round(percentage)}%</span>
        </div>
        
        {/* 🔥 THE FIX: Use standard light/dark background classes */}
        <div className="w-full h-2 bg-gray-700 dark:bg-gray-400 rounded-full overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
          <div 
            // Bar color relies on inline style (config.hex) to be dynamic
            className={`h-full rounded-full transition-all duration-1000 ease-out relative`}
            style={{ 
              width: `${percentage}%`,
              boxShadow: `0 0 10px ${config.hex}`,
              backgroundColor: config.hex,
            }}
          >
            {/* Shimmer effect on the bar */}
            <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}