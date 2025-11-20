import React, { useState, useMemo, useEffect, useContext, useRef, useLayoutEffect } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import MainPredictionCardSkeleton from "./MainPredictionCard.Skeleton"; // <-- 1. IMPORT SKELETON
import MaskMan from "../assets/MaskMan.png" 
function pm25ToAQI(pm25) {
  if (pm25 === null || pm25 === undefined || isNaN(parseFloat(pm25))) return 0;
  const pm = parseFloat(pm25);
  // Indian CPCB Breakpoints (PM2.5 to AQI)
  if (pm <= 30) return Math.round((50 / 30) * pm);
  if (pm <= 60) return Math.round(((100 - 51) / (60 - 30)) * (pm - 30) + 51);
  if (pm <= 90) return Math.round(((200 - 101) / (90 - 60)) * (pm - 60) + 101);
  if (pm <= 120) return Math.round(((300 - 201) / (120 - 90)) * (pm - 90) + 201);
  if (pm <= 250) return Math.round(((400 - 301) / (250 - 120)) * (pm - 120) + 301);
  if (pm > 250) return Math.round(((500 - 401) / (380 - 250)) * (pm - 250) + 401);
  
  return 500;
}

function getAQICategory(aqi) {
  if (aqi === null || aqi === "...") return "Loading...";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 200) return "Poor";
  if (aqi <= 300) return "Unhealthy";
  if (aqi <= 400) return "Severe";
  return "Hazardous";
}

function getAQIColorStyles(aqi, theme = "light") {
  // ... (This entire function is unchanged)
  // 🔥 FIX 1: Changed hardcoded colors to your CSS variable
  const cardTopBgColor = "var(--card)";
  const topMainTextColor = theme === "dark" ? "#e5e7eb" : "#374151";
  const opacity = "20";

  const scaleColors = {
    good: "#00E400",
    moderate: "#F0D400",
    poor: "#F07554",
    unhealthy: "#F54E8E",
    severe: "#8F3F97",
    hazardous: "#7E0023",
  };

  if (aqi === null || aqi === "...") {
    const mainColor = "#9ca3af";
    return {
      background: cardTopBgColor,
      aqiValueColor: topMainTextColor,
      categoryBgColor: `${mainColor}${opacity}`,
      categoryTextColor: topMainTextColor,
      pmValueColor: topMainTextColor,
      aqiScaleLabelsColor: topMainTextColor,
      aqiScaleNumbersColor: topMainTextColor,
      timeDateColor: topMainTextColor,
      accentColor: "#6366f1",
      cardTopBgColor: cardTopBgColor,
      scaleColors: {
        good: "#9ca3af", moderate: "#9ca3af", poor: "#F07554",
        unhealthy: "#f74f8f", severe: "#9ca3af", hazardous: "#9ca3af",
      }
    };
  }

  let aqiValueColor;
  let categoryTextColor;
  let pmValueColor = topMainTextColor;
  let categoryBgColor;
  let mainBgColor = cardTopBgColor;
  let accentColor;

  if (aqi <= 50) {
    aqiValueColor = scaleColors.good;
    categoryTextColor = topMainTextColor;
    categoryBgColor = `${scaleColors.good}${opacity}`;
    accentColor = scaleColors.good;
    mainBgColor = `linear-gradient(to bottom, ${cardTopBgColor} 30%, #69FF69 150%)`;
  } else if (aqi <= 100) {
    aqiValueColor = scaleColors.moderate;
    categoryTextColor = topMainTextColor;
    categoryBgColor = `${scaleColors.moderate}${opacity}`;
    accentColor = scaleColors.moderate;
    mainBgColor = `linear-gradient(to bottom, ${cardTopBgColor} 30%, #FFFF4A 175%)`;
  } else if (aqi <= 200) {
    aqiValueColor = scaleColors.poor;
    categoryTextColor = topMainTextColor;
    categoryBgColor = `${scaleColors.poor}${opacity}`;
    accentColor = scaleColors.poor;
    mainBgColor = `linear-gradient(to bottom, ${cardTopBgColor} 30%, #FC896A 150%)`;
  } else if (aqi <= 300) {
    aqiValueColor = scaleColors.unhealthy;
    categoryTextColor = scaleColors.unhealthy;
    categoryBgColor = `${scaleColors.unhealthy}${opacity}`;
    pmValueColor = scaleColors.unhealthy;
    accentColor = scaleColors.unhealthy;
    mainBgColor = `linear-gradient(to bottom, ${cardTopBgColor} 30%, #FF6E9F40 150%)`;
  } else if (aqi <= 400) {
    aqiValueColor = scaleColors.severe;
    categoryTextColor = theme === "dark" ? "#e5e7eb" : "#374151";
    categoryBgColor = `${scaleColors.severe}${opacity}`;
    pmValueColor = theme === "dark" ? "#e5e7eb" : "#374151";
    accentColor = scaleColors.severe;
    mainBgColor = `linear-gradient(to bottom, ${cardTopBgColor} 30%, #AB4BB4 150%)`;
  } else {
    aqiValueColor = scaleColors.hazardous;
    categoryTextColor = theme === "dark" ? "#e5e7eb" : "#374151";
    categoryBgColor = `${scaleColors.hazardous}${opacity}`;
    pmValueColor = theme === "dark" ? "#e5e7eb" : "#374151";
    accentColor = scaleColors.hazardous;
    mainBgColor = `linear-gradient(to bottom, ${cardTopBgColor} 30%, #A3002E 150%)`;
  }

  if (aqi > 200 && theme === "light") {
    categoryTextColor = topMainTextColor;
    pmValueColor = topMainTextColor;
  }
  if (aqi > 200 && theme === "dark") {
    categoryTextColor = "#e5e7eb";
    pmValueColor = "#e5e7eb";
  }

  return {
    background: mainBgColor,
    aqiValueColor,
    categoryBgColor,
    categoryTextColor,
    pmValueColor,
    aqiScaleLabelsColor: topMainTextColor,
    aqiScaleNumbersColor: topMainTextColor,
    timeDateColor: topMainTextColor,
    accentColor,
    cardTopBgColor,
    scaleColors,
  };
}

// <-- 2. NEW MEMOIZED COMPONENT FOR THE SCALE BAR
const AqiScaleBar = React.memo(function AqiScaleBar({ scaleColors, labelColor }) {
  return (
    <div className="mt-6" style={{ color: labelColor }}>
      <div className="flex justify-between text-xs font-medium px-1">
        <span>Good</span>
        <span>Moderate</span>
        <span>Poor</span>
        <span>Unhealthy</span>
        <span>Severe</span>
        <span>Hazardous</span>
      </div>
      <div className="flex w-full h-2 rounded-full overflow-hidden mt-1 shadow-inner">
        <div className="w-1/6 h-full" style={{ backgroundColor: scaleColors.good }}></div>
        <div className="w-1/6 h-full" style={{ backgroundColor: scaleColors.moderate }}></div>
        <div className="w-1/6 h-full" style={{ backgroundColor: scaleColors.poor }}></div>
        <div className="w-1/6 h-full" style={{ backgroundColor: scaleColors.unhealthy }}></div>
        <div className="w-1/6 h-full" style={{ backgroundColor: scaleColors.severe }}></div>
        <div className="w-1/6 h-full" style={{ backgroundColor: scaleColors.hazardous }}></div>
      </div>
      <div className="flex justify-between text-xs font-medium px-1 mt-1">
        <span>0</span>
        <span>50</span>
        <span>100</span>
        <span>200</span>
        <span>300</span>
        <span>401+</span>
      </div>
    </div>
  );
});


export default function MainPredictionCard({ liveAqiData, predData, loading }) {
  const { theme } = useContext(ThemeContext);
  const timeChipsRef = useRef(null);
  
  // ... (useState and useEffects for selectedHourIndex are unchanged) ...
  const [selectedHourIndex, setSelectedHourIndex] = useState(() => {
    const saved = localStorage.getItem("selectedHourIndex");
    if (saved !== null) return Number(saved);
  
    // Default = last predicted hour (not Live)
    if (predData && predData.predictions?.length > 0) {
      return predData.predictions.length - 1;
    }
  
    return -1; // fallback to Live
  });
  useEffect(() => {
    const saved = localStorage.getItem("selectedHourIndex");
  
    // If user already had a saved selected hour, don't override it
    if (saved !== null) return;
  
    // Once predictions arrive, set default to last hour
    if (predData && predData.predictions?.length > 0) {
      const lastIndex = predData.predictions.length - 1;
      setSelectedHourIndex(lastIndex);
      localStorage.setItem("selectedHourIndex", lastIndex);
    }
  }, [predData]);
  
  
    useLayoutEffect(() => {
      if (timeChipsRef.current) {
        const activeChip = timeChipsRef.current.querySelector(
          `[data-time-index="${selectedHourIndex}"]`
        );
        if (activeChip) {
          activeChip.scrollIntoView({
            behavior: "instant",
            block: "nearest",
            inline: "center",
          });
        }
      }
    }, []);
  
    useEffect(() => {
      if (timeChipsRef.current) {
        const activeChip = timeChipsRef.current.querySelector(
          `[data-time-index="${selectedHourIndex}"]`
        );
        if (activeChip) {
          activeChip.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      }
    }, [selectedHourIndex, loading]);


  // <-- 3. DETERMINE LOADING STATE *BEFORE* useMemo
  // This state is true if the parent is loading OR if we have no data at all yet
  const isLoading = loading || (!liveAqiData && !predData);

  // ... inside MainPredictionCard function ...

  const {
    aqi,
    category,
    pm25,
    lower_95,
    upper_95,
    time,
    date,
    day,
  } = useMemo(() => {
    if (isLoading) { 
      return {
        aqi: "...", category: "Loading...", pm25: "...",
        lower_95: "...", upper_95: "...", time: "...",
        date: "Loading forecast...", day: "...",
      };
    }

    // 1. Live AQI Mode (Index -1)
    if (selectedHourIndex === -1 && liveAqiData) {
      const livePm25 = liveAqiData.pm25;
      const liveAqi = pm25ToAQI(livePm25);
      const liveDate = new Date(liveAqiData.datetime);
      
      // Safety: Ensure livePm25 is a number
      const validLive = typeof livePm25 === 'number' && !isNaN(livePm25);

      return {
        aqi: liveAqi,
        category: getAQICategory(liveAqi),
        pm25: validLive ? livePm25.toFixed(1) : "--",
        lower_95: validLive ? (liveAqi * 0.8).toFixed(1) : "--",
        upper_95: validLive ? (liveAqi * 1.2).toFixed(1) : "--",
        time: liveDate.toLocaleTimeString("en-US", {
          hour: "numeric", minute: "2-digit", hour12: false,
        }),
        date: liveDate.toLocaleDateString("en-US", {
          day: "2-digit", month: "short", year: "numeric",
        }),
        day: liveDate.toLocaleDateString("en-US", { weekday: "long" }),
      };
    }

    // 2. Error Handling for Missing Predictions
    if (!predData || !predData.predictions?.length) {
      return {
        aqi: "N/A", category: "Unavailable", pm25: "N/A",
        lower_95: "N/A", upper_95: "N/A",
        time: "N/A", date: "No Data", day: "Error",
      };
    }

    // 3. Prediction Mode
    const maxIndex = predData.predictions.length - 1;
    const validIndex = Math.max(0, Math.min(selectedHourIndex, maxIndex));
    const prediction = predData.predictions[validIndex];

    if (!prediction) {
      return {
        aqi: "N/A", category: "Error", pm25: "N/A",
        lower_95: "N/A", upper_95: "N/A",
        time: "N/A", date: "Error", day: "Error",
      };
    }

    const pm = prediction.pm25;
    
    // 🔥 VITAL FIX: Check for null/NaN before using toFixed()
    const isValid = typeof pm === 'number' && !isNaN(pm);
    const calculatedAqi = isValid ? pm25ToAQI(pm) : 0;
    const predDate = new Date(prediction.datetime);

    return {
      aqi: isValid ? calculatedAqi : "N/A",
      category: isValid ? getAQICategory(calculatedAqi) : "Unavailable",
      pm25: isValid ? pm.toFixed(1) : "--", // Prevents crash on null
      
      // Check confidence intervals too
      lower_95: (typeof prediction.lower_95 === 'number') ? prediction.lower_95.toFixed(1) : "--",
      upper_95: (typeof prediction.upper_95 === 'number') ? prediction.upper_95.toFixed(1) : "--",
      
      time: predDate.toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: false
      }),
      date: predDate.toLocaleDateString("en-US", {
        day: "2-digit", month: "short", year: "numeric"
      }),
      day: predDate.toLocaleDateString("en-US", { weekday: "long" }),
    };
  }, [predData, liveAqiData, isLoading, selectedHourIndex]);

  // <-- 4. MEMOIZE THE COLOR STYLES
  const colorStyles = useMemo(() => {
    // We still pass 'theme' because your original logic uses it
    return getAQIColorStyles(aqi, theme);
  }, [aqi, theme]);

  const formatTimeChip = (datetime) =>
    new Date(datetime)
      .toLocaleTimeString("en-US", { hour: "numeric", hour12: true })
      .replace(" ", "")
      .toLowerCase();

  // ... (handleTimeChange function is unchanged) ...
  const handleTimeChange = (direction) => {
    const numPredictions = predData?.predictions?.length || 0;
    const totalItems = (liveAqiData ? 1 : 0) + numPredictions; // Only include Live if it exists

    let currentIndex = selectedHourIndex + (liveAqiData ? 1 : 0); // 0 is Live, 1 is first pred
    let nextIndex =
      direction === "next"
        ? (currentIndex + 1) % totalItems
        : (currentIndex - 1 + totalItems) % totalItems;

    setSelectedHourIndex(nextIndex - (liveAqiData ? 1 : 0)); // Convert back to -1 for Live
    localStorage.setItem("selectedHourIndex", nextIndex - (liveAqiData ? 1 : 0));
  };


  // <-- 5. RENDER THE SKELETON IF LOADING
  if (isLoading) {
    return <MainPredictionCardSkeleton />;
  }

  // ... (The rest of your return() JSX is unchanged, except for the scale bar)
  return (
    <section className="max-w-[1200px] mx-auto px-4 md:px-6 -mt-33 relative z-30">
      <div
        // 🔥 FIX 2: Replaced hardcoded borders with your CSS variable
        className="rounded-3xl p-6 md:p-8 shadow-xl border bg-[var(--card)] border-[var(--card-border)] transition-all duration-300 overflow-hidden"
        style={{ background: colorStyles.background }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start h-full">

          {/* COLUMN 1 */}
          <div className="flex flex-col space-y-4" style={{ color: colorStyles.aqiScaleLabelsColor }}>
            {/* ... (Live AQI, value, category, confidence range are all unchanged) ... */}
            <div className="flex items-baseline gap-2">
              {selectedHourIndex === -1 && liveAqiData && (
                <span className="w-3 h-3 rounded-full bg-red-500 mr-1 animate-pulse"></span>
              )}
              <span className="text-base font-sizefont-bold">
                {selectedHourIndex === -1 ? "Live AQI" : "Predicted Air Quality Index (AQI)"}
              </span>
            </div>

            <div className="flex items-center justify-center gap-4">
              <div
                className="text-7xl lg:text-8xl font-extrabold"
                style={{
                  color: colorStyles.aqiValueColor,
                  textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                {aqi}
              </div>
            </div>

            <div
              className="inline-flex items-center justify-center px-4 py-3 rounded-lg text-xl font-semibold leading-none"
              style={{
                backgroundColor: colorStyles.categoryBgColor,
                color: colorStyles.categoryTextColor,
                textShadow: "0 1px 2px rgba(0,0,0,0.1)",
              }}
            >
              Air Quality will be {category}
            </div>

            <div className="flex justify-between mt-4">
              <div>
                <span className="text-sm font-semibold">Confidence Range (PM2.5)</span>
                <span className="text-xl font-bold block" style={{ color: colorStyles.pmValueColor }}>
                  {lower_95} - {upper_95}
                </span>
              </div>
              <div>
                <span className="text-sm font-semibold">PM2.5</span>
                <span className="text-xl font-bold block" style={{ color: colorStyles.pmValueColor }}>
                  {pm25} <span className="text-sm font-normal">µg/m³</span>
                </span>
              </div>
            </div>

            {/* <-- 6. REPLACE THE OLD SCALE BAR... */}
            {/* <div className="mt-6"> ... </div> */}
            
            {/* ...WITH THE NEW MEMOIZED COMPONENT */}
            <AqiScaleBar
              scaleColors={colorStyles.scaleColors}
              labelColor={colorStyles.aqiScaleLabelsColor}
            />
          </div>

          {/* COLUMN 2 */}
          {/* ... (This is unchanged) ... */}
          <div className="flex items-end justify-center relative min-h-[200px] md:min-h-[300px]">
            <div
              className="absolute bottom-0 h-[250px] w-[150px] bg-no-repeat bg-bottom bg-contain"
              style={{
                backgroundImage: `url('${MaskMan}')`,
              }}
            ></div>
          </div>

          {/* COLUMN 3 */}
          {/* ... (This is unchanged) ... */}
          <div className="flex flex-col justify-center items-center h-full">
            <div className="flex flex-col items-center text-center">
              <p className="text-4xl font-semibold" style={{ color: colorStyles.timeDateColor, opacity: 0.9 }}>
                {day}
              </p>
              <p className="text-5xl font-bold" style={{ color: colorStyles.aqiScaleLabelsColor, opacity: 0.9 }}>
                {date}
              </p>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-center space-x-1">
                <button
                  onClick={() => handleTimeChange("prev")}
                  disabled={loading}
                  className="cursor-pointer p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  style={{ color: colorStyles.accentColor }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </button>

                <div
                  ref={timeChipsRef}
                  className="flex space-x-2 overflow-x-hidden pb-2"
                  style={{ width: "100%", maxWidth: "280px" }}
                >
                  {liveAqiData && (
                    <button
                      data-time-index="-1"
                      onClick={() => {
                        setSelectedHourIndex(-1);
                        localStorage.setItem("selectedHourIndex", -1);
                      }}
                      className={`
                        cursor-pointer shrink-0 px-5 py-2.5 rounded-full text-base font-semibold transition-all
                        ${selectedHourIndex === -1 ? "text-white shadow-md" : "bg-black/5 dark:bg-white/10"}
                      `}
                      style={{
                        backgroundColor: selectedHourIndex === -1 ? colorStyles.accentColor : undefined,
                        color: selectedHourIndex === -1 ? "white" : colorStyles.timeDateColor,
                      }}
                    >
                      Live
                    </button>
                  )}

                  {predData &&
                    predData?.predictions?.map((pred, index) => (
                      <button
                        key={pred.datetime}
                        data-time-index={index}
                        onClick={() => {
                          setSelectedHourIndex(index);
                          localStorage.setItem("selectedHourIndex", index);
                        }}
                        className={`
                          cursor-pointer shrink-0 px-5 py-2.5 rounded-full text-base font-semibold transition-all
                          ${selectedHourIndex === index ? "text-white shadow-md" : "bg-black/5 dark:bg-white/10"}
                        `}
                        style={{
                          backgroundColor: selectedHourIndex === index ? colorStyles.accentColor : undefined,
                          color: selectedHourIndex === index ? "white" : colorStyles.timeDateColor,
                        }}
                      >
                        {formatTimeChip(pred.datetime)}
                      </button>
                    ))}
                </div>

                <button
                  onClick={() => handleTimeChange("next")}
                  disabled={loading}
                  className="cursor-pointer p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  style={{ color: colorStyles.accentColor }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}