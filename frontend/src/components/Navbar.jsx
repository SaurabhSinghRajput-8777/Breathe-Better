// src/components/Navbar.jsx
// 🔥 FIX: Added new imports for our custom dropdown
import { useContext, useState, useRef, useEffect } from "react"; 
import { ThemeContext } from "../context/ThemeContext";
import { Link, useLocation } from "react-router-dom";

export default function Navbar({ tabs }) {
  const { theme, setTheme, city, setCity } = useContext(ThemeContext);
  const location = useLocation();

  return (
    <header
      className="
        fixed top-0 left-0 w-full z-50
        backdrop-blur-md bg-[var(--bg)]/80
        border-b border-[var(--card-border)]
        transition-all
      "
    >
      <nav className="w-full h-20 grid grid-cols-3 items-center px-4 md:px-8">

        {/* LEFT — LOGO */}
        <div className="text-xl font-bold tracking-wide select-none text-primary">
          <Link to="/">BreatheBetter AI</Link>
        </div>

        {/* CENTER — NAV TABS (Hidden on mobile) */}
        <div className="hidden md:flex items-center justify-center gap-2">
          {tabs.map((tab) => {
            const linkPath = tab.toLowerCase();
            const isActive =
              location.pathname === `/${linkPath}` ||
              (linkPath === "home" && location.pathname === "/");

            return (
              <Link
                key={tab}
                to={linkPath === "home" ? "/" : `/${linkPath}`}
                className={`
                  text-sm font-medium transition-colors
                  px-4 py-2 rounded-full
                  ${
                    isActive
                      ? "text-indigo-700 bg-indigo-100 dark:text-white dark:bg-indigo-600/95 font-semibold"
                      : "text-secondary hover:text-primary hover:bg-gray-500/20"
                  }
                `}
              >
                {tab}
              </Link>
            );
          })}
        </div>

        {/* RIGHT — CONTROLS + LOGIN */}
        <div className="flex items-center justify-end gap-4">
          
          <CityDropdown city={city} setCity={setCity} />

          {/* --- SEPARATOR --- */}
          <div className="h-6 w-px bg-[var(--card-border)]"></div>

          {/* THEME TOGGLE */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="
              w-10 h-10 rounded-lg flex items-center justify-center
              bg-[var(--card)] border border-[var(--card-border)]
              text-primary shadow hover:shadow-lg transition hover:cursor-pointer
            "
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* --- SEPARATOR --- */}
          <div className="h-6 w-px bg-[var(--card-border)]"></div>

          {/* NEW LOGIN BUTTON */}
          <Link
            to="/login"
            className="
              px-4 py-2 rounded-lg text-sm font-medium
              bg-indigo-600 hover:bg-indigo-700 text-white
              shadow hover:shadow-lg transition-colors
            "
          >
            Login
          </Link>
        </div>
      </nav>
    </header>
  );
}


// ------------------------------------------------------------------
// 🔥 NEW CUSTOM DROPDOWN COMPONENT
// ------------------------------------------------------------------
const CITIES = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Kolkata"];

function CityDropdown({ city, setCity }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // This hook closes the dropdown if you click outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleSelectCity = (selectedCity) => {
    setCity(selectedCity);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 1. The Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center justify-between
          {/* 🔥 FIX: Removed w-32 to let it size automatically */}
          pl-3 pr-2 py-2 rounded-lg text-sm font-medium
          bg-[var(--card)] text-primary 
          border border-[var(--card-border)]
          shadow hover:shadow-md transition
          outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          hover:cursor-pointer
        "
      >
        {/* 🔥 FIX 2: Added Location Icon */}
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <span>{city}</span>
        </span>
        {/* The dropdown arrow, which spins */}
        <svg 
          className={`w-5 h-5 text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 2. The Options Menu (now fully styled) */}
      {isOpen && (
        <div
          className="
            absolute top-full left-0 mt-2 w-full
            bg-[var(--card)] border border-[var(--card-border)]
            rounded-lg shadow-lg overflow-hidden
            z-[100] {/* 🔥 FIX: Set z-index higher than the main card (z-30) */}
          "
        >
          {CITIES.map((c) => (
            <button
              key={c}
              onClick={() => handleSelectCity(c)}
              className={`
                w-full text-left px-4 py-2 text-sm text-primary
                hover:bg-gray-500/20 {/* Theme-agnostic hover */}
                ${city === c ? 'bg-gray-500/20 font-semibold' : ''}
              `}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}