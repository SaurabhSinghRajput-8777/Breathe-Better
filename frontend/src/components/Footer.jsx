// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer 
      className="
        w-full mt-auto z-40
        border-t border-[var(--card-border)]
        bg-[var(--card)]/80 backdrop-blur-md
        transition-colors duration-300
      "
    >
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        
        {/* Top Section: 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          
          {/* Col 1: Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {/* Logo Icon */}
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold">
                B
              </div>
              <span className="text-xl font-bold text-primary tracking-tight">
                BreatheBetter AI
              </span>
            </div>
            <p className="text-sm text-secondary leading-relaxed max-w-xs">
              Empowering you with real-time air quality insights and AI-driven forecasts to make healthier decisions for you and your family.
            </p>
          </div>

          {/* Col 2: Quick Navigation */}
          <div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">
              Explore
            </h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li>
                <Link to="/" className="hover:text-indigo-500 transition-colors">
                  Live Dashboard
                </Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-indigo-500 transition-colors">
                  City Comparison
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-indigo-500 transition-colors">
                  Historical Data
                </Link>
              </li>
              <li>
                <Link to="/reports" className="hover:text-indigo-500 transition-colors">
                  Download Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Tech & Socials */}
          <div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">
              Powered By
            </h3>
            <ul className="space-y-2 text-sm text-secondary mb-6">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                OpenWeatherMap API
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Open-Meteo Data
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                Ensemble Machine Learning Model (XGBoost + Random Forest + Linear Regression)
              </li>
            </ul>

            {/* Social Icons */}
            <div className="flex gap-4">
              <SocialLink href="#" label="Github">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </SocialLink>
              <SocialLink href="#" label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </SocialLink>
              <SocialLink href="#" label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/></svg>
              </SocialLink>
            </div>
          </div>

        </div>

        {/* Bottom Section: Copyright & Legal */}
        <div className="border-t border-[var(--card-border)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-secondary text-center md:text-left">
            © 2025 BreatheBetter AI. All Rights Reserved.
          </p>
          <div className="flex gap-6 text-xs text-secondary font-medium">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
}

// Helper Component for Social Icons
function SocialLink({ href, children, label }) {
  return (
    <a 
      href={href} 
      aria-label={label}
      className="
        w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 
        flex items-center justify-center 
        text-gray-600 dark:text-gray-400
        hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white
        transition-all duration-300
      "
    >
      {children}
    </a>
  );
}