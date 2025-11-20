// src/components/AlertsList.jsx
import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

export default function AlertsList({ timeline = [], onClear }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  // --- THEME CONFIGURATION ---
  const THEME = {
    headerBg: isDark ? "bg-white/5" : "bg-gray-50/80",
    headerBorder: isDark ? "border-white/10" : "border-gray-200",
    clearBtn: isDark 
      ? "text-rose-400 hover:bg-rose-900/20" 
      : "text-rose-500 hover:bg-rose-50",
    scrollTrack: isDark ? "scrollbar-thumb-gray-700" : "scrollbar-thumb-gray-200",
    emptyIconBg: isDark ? "bg-gray-800 text-gray-600" : "bg-gray-100 text-gray-400",
    timelineLine: isDark ? "bg-gray-800" : "bg-gray-100",
  };

  // Helper to get styles for each alert type
  const getAlertStyles = (type) => {
    // 1. FORECAST (Yellow/Amber)
    if (type === "prediction") {
      return {
        iconBg: isDark ? "bg-amber-500/20 text-amber-500" : "bg-amber-100 text-amber-600",
        border: isDark ? "border-l-4 border-amber-500" : "border-l-4 border-amber-400",
        cardBg: isDark ? "bg-amber-500/10" : "bg-amber-50/50",
        title: isDark ? "text-amber-400" : "text-amber-700",
        descBorder: isDark ? "border-amber-500/20" : "border-amber-100",
        sourceBadge: isDark 
          ? "bg-amber-500/20 text-amber-300 border-amber-500/30" 
          : "bg-amber-50 text-amber-700 border-amber-200"
      };
    }
    // 2. SEVERE LIVE (Red/Rose)
    if (type === "severe") {
      return {
        iconBg: isDark ? "bg-rose-500/20 text-rose-400" : "bg-rose-100 text-rose-600",
        border: isDark ? "border-l-4 border-rose-500" : "border-l-4 border-rose-500",
        cardBg: isDark ? "bg-rose-500/10" : "bg-rose-50/30",
        title: isDark ? "text-rose-400" : "text-rose-700",
        descBorder: isDark ? "border-rose-500/20" : "border-rose-100",
        sourceBadge: isDark 
          ? "bg-rose-500/20 text-rose-300 border-rose-500/30" 
          : "bg-rose-50 text-rose-700 border-rose-200"
      };
    }
    // 3. DEFAULT / MINOR (Gray)
    return {
      iconBg: isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500",
      border: isDark ? "border-l-4 border-gray-600" : "border-l-4 border-gray-300",
      cardBg: isDark ? "bg-white/5" : "bg-gray-50",
      title: isDark ? "text-gray-200" : "text-gray-700",
      descBorder: isDark ? "border-white/5" : "border-gray-100",
      sourceBadge: isDark 
        ? "bg-white/10 text-gray-400 border-white/10" 
        : "bg-gray-100 text-gray-600 border-gray-200"
    };
  };

  return (
    <div 
      className="
        h-full flex flex-col 
        bg-[var(--card)] border border-[var(--card-border)] 
        rounded-3xl shadow-sm overflow-hidden transition-all
      "
    >
      
      {/* Header */}
      <div className={`px-6 py-5 flex items-center justify-between backdrop-blur-sm border-b ${THEME.headerBg} ${THEME.headerBorder}`}>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-yellow-600 animate-pulse"></div>
          <h2 className="text-lg font-bold text-primary tracking-tight">Activity Log</h2>
        </div>
        
        {timeline.length > 0 && (
          <button 
            onClick={onClear}
            className={`
              group flex items-center gap-1.5 px-3 py-1.5 rounded-lg 
              text-xs font-bold uppercase tracking-wider 
              transition-all active:scale-95 hover:cursor-pointer
              ${THEME.clearBtn}
            `}
          >
            <span>Clear Log</span>
            <svg className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 hover:cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        )}
      </div>

      {/* Feed Content */}
      <div className={`flex-1 p-6 overflow-y-auto min-h-[400px] max-h-[600px] scrollbar-thin ${THEME.scrollTrack}`}>
        
        {timeline.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-12 select-none">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-inner ${THEME.emptyIconBg}`}>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p className="text-primary font-bold text-lg">All Clear</p>
            <p className="text-xs text-secondary mt-1 max-w-xs">
              No alerts generated yet. Enjoy the fresh air!
            </p>
          </div>
        ) : (
          <div className="relative pl-2">
            {/* Continuous Line Background */}
            <div className={`absolute top-4 bottom-4 left-[19px] w-0.5 ${THEME.timelineLine}`}></div>

            {timeline.map((item) => {
              const isPrediction = item.source === "AI Forecast"; 
              const isSevere = item.category?.includes("Severe") || item.category?.includes("Hazardous");
              
              // Determine Style Type
              const styleType = isPrediction ? "prediction" : (isSevere ? "severe" : "default");
              const styles = getAlertStyles(styleType);

              // Icon Selection
              const Icon = isPrediction ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              );

              return (
                <div key={item.id} className="relative flex gap-4 mb-6 last:mb-0 group animate-in slide-in-from-left-2 duration-300">
                  
                  {/* Left: Icon Node */}
                  <div className={`
                     relative z-10 w-10 h-10 rounded-full flex items-center justify-center 
                     shadow-sm border-4 border-[var(--card)] shrink-0
                     ${styles.iconBg}
                  `}>
                     {Icon}
                  </div>

                  {/* Right: Card Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <h4 className={`text-sm font-bold ${styles.title}`}>
                        {item.type}
                      </h4>
                      
                      {/* Time Display */}
                      <div className="text-right">
                        {isPrediction && item.targetTime ? (
                           <span className="text-xs text-secondary">
                              Expected <span className="font-bold text-primary">{item.targetTime}</span>
                           </span>
                        ) : (
                           <span className="text-xs font-bold text-secondary opacity-80">
                              {item.time.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                           </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Description Box */}
                    <div className={`
                        p-3.5 rounded-xl text-xs text-secondary leading-relaxed shadow-sm border
                        ${styles.cardBg} ${styles.descBorder}
                    `}>
                       {item.desc ? item.desc : (
                         <>PM2.5 reached <span className="font-bold text-primary">{Math.round(item.val)}</span> ({item.category})</>
                       )}
                    </div>

                    {/* Footer: Source + Timestamp */}
                    <div className="flex items-center gap-2 mt-2">
                         <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${styles.sourceBadge}`}>
                             {item.source}
                         </span>
                         
                         {isPrediction && (
                            <span className="text-[9px] text-secondary opacity-80">
                               Generated: {item.time.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                            </span>
                         )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}