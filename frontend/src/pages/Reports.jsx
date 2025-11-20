// src/pages/Reports.jsx
import React, { useContext, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { downloadPdfReport } from "../lib/api";

export default function Reports() {
  const { city } = useContext(ThemeContext);
  const [days, setDays] = useState(7); // Default to 3 as requested
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await downloadPdfReport(city, days);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${city}_BreatheBetter_Report_${days}Days.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
      alert("Failed to download report. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[--bg] transition-colors pb-20">
      <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-12">
        
        {/* Updated Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/20 rounded-xl text-indigo-500">
                {/* Report/Chart Icon */}
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              Analytics & Reporting
            </h1>
            <p className="text-sm text-secondary mt-1 ml-1">
              Generate comprehensive insights, historical trends, and AI-powered forecasts for <span className="font-bold text-primary">{city}</span>.
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 bg-[var(--card)] border border-[var(--card-border)] rounded-3xl shadow-xl overflow-hidden">
          
          {/* LEFT: Visual Preview (CSS Mockup) */}
          <div className="md:col-span-5 bg-gradient-to-br from-indigo-500 to-purple-600 p-10 flex items-center justify-center relative overflow-hidden">
            {/* Decorative Background Effects */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-black/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
            
            {/* Document Mockup */}
            <div className="relative z-10 w-48 aspect-[1/1.414] bg-white rounded-lg shadow-2xl p-4 flex flex-col gap-3 transform transition-transform hover:scale-105 duration-500">
               {/* Header Lines */}
               <div className="h-2 w-1/2 bg-indigo-500 rounded-full opacity-20"></div>
               <div className="h-2 w-1/3 bg-gray-300 rounded-full mb-2"></div>
               
               {/* Mock Chart */}
               <div className="flex-1 bg-indigo-50 rounded border border-indigo-100 flex items-end justify-between p-2 gap-1">
                  <div className="w-1/5 h-[40%] bg-indigo-300 rounded-t"></div>
                  <div className="w-1/5 h-[70%] bg-indigo-400 rounded-t"></div>
                  <div className="w-1/5 h-[50%] bg-indigo-300 rounded-t"></div>
                  <div className="w-1/5 h-[80%] bg-indigo-500 rounded-t"></div>
               </div>
               
               {/* Text Lines */}
               <div className="space-y-1.5">
                 <div className="h-1.5 w-full bg-gray-200 rounded-full"></div>
                 <div className="h-1.5 w-5/6 bg-gray-200 rounded-full"></div>
                 <div className="h-1.5 w-4/6 bg-gray-200 rounded-full"></div>
               </div>

               {/* Floating Badge */}
               <div className="absolute -right-3 -bottom-3 bg-white text-indigo-600 text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-indigo-100">
                 PDF
               </div>
            </div>
          </div>

          {/* RIGHT: Configuration Controls */}
          <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-center">
            
            <div className="mb-8">
               <h2 className="text-xl font-bold text-primary mb-2">Configure Report</h2>
               <p className="text-sm text-secondary leading-relaxed">
                 Select the time range for your analysis. The generated report includes hourly PM2.5 breakdowns, health safety categories, and AI model accuracy metrics.
               </p>
            </div>

            {/* Duration Selector */}
            <div className="mb-8">
              <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-3 block">
                Time Range
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`
                      py-3 rounded-xl text-sm font-bold transition-all border
                      ${days === d 
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-105 hover:cursor-pointer" 
                        : "bg-[var(--bg)] text-secondary border-transparent hover:cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-white/5"}
                    `}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Tags */}
            <div className="mb-8 flex flex-wrap gap-3">
               <FeatureTag icon="📊" text="Trend Analysis" />
               <FeatureTag icon="🤖" text="AI Metrics" />
               <FeatureTag icon="🏥" text="Daily Summary Table" />
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`
                w-full py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all
                ${downloading 
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:cursor-pointer hover:from-indigo-500 hover:to-purple-500 text-white hover:shadow-indigo-500/25 active:scale-95"}
              `}
            >
              {downloading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Generating Report...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Download PDF Report
                </>
              )}
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}

// Helper Component for badges
function FeatureTag({ icon, text }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-bold text-secondary border border-gray-200 dark:border-white/10 select-none">
      <span>{icon}</span> {text}
    </span>
  );
}