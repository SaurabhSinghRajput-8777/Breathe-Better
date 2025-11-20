// src/pages/About.jsx
import React from "react";

export default function About() {
  return (
    // Reduced pb-20 to pb-10 to decrease footer gap
    <div className="min-h-screen bg-[--bg] transition-colors pb-10">
      
      {/* Hero with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            Breathing new life into data.
          </h1>
          <p className="text-indigo-100 text-lg md:text-xl leading-relaxed">
            BreatheBetter AI combines real-time monitoring with advanced machine learning to predict air quality trends, helping you plan a healthier future.
          </p>
        </div>
      </div>

      {/* Reduced py-16 to py-12 */}
      <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-12">
        
        {/* Section 1: Our Mission (Text Left - Image Right) */}
        <div className="mb-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-4">Our Mission</h2>
            <p className="text-secondary leading-relaxed">
              Air pollution is one of the greatest environmental health risks of our time. Our mission is to democratize access to accurate, hyper-local air quality data. By leveraging satellite imagery and ground station data, we provide actionable insights that empower communities to take precautions when it matters most.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-3xl h-64 flex items-center justify-center text-gray-300 shadow-inner">
             <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path></svg>
          </div>
        </div>

        {/* Section 2: Our Vision (Image Left - Text Right) */}
        {/* Removed mb-8 since it's the last element */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
           {/* Image Block */}
           <div className="bg-gray-100 dark:bg-gray-800 rounded-3xl h-64 flex items-center justify-center text-gray-300 shadow-inner order-last md:order-first">
             <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
             </svg>
          </div>
          
          {/* Text Block */}
          <div>
            <h2 className="text-2xl font-bold text-primary mb-4">Our Vision</h2>
            <p className="text-secondary leading-relaxed">
              We envision a world where clean air is a fundamental right, not a luxury. Through continuous innovation and community engagement, we aim to build a global network of informed citizens who can actively contribute to a healthier, sustainable planet.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}