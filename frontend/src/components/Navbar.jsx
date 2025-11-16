import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { Link, useLocation } from "react-router-dom";

export default function Navbar({ tabs }) {
  const { theme, setTheme } = useContext(ThemeContext);
  const location = useLocation();

  return (
    <header
      className="
        fixed top-0 left-0 w-full z-50
        backdrop-blur-md bg-(--bg)/80
        border-b border-gray-300 dark:border-gray-700
        transition-all
      "
    >
      {/* FULL WIDTH NAV */}
      <nav className="w-full h-20 flex items-center justify-between px-4 md:px-8">

        {/* LEFT — LOGO */}
        <div className="text-xl font-bold tracking-wide select-none text-primary">
          BreatheBetter
        </div>

        {/* RIGHT — TABS + TOGGLE */}
        <div className="flex items-center gap-6">

          {/* NAVIGATION TABS */}
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
                  text-sm font-medium transition
                  ${isActive
                    ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-secondary hover:text-indigo-500"
                  }
                `}
              >
                {tab}
              </Link>
            );
          })}

          {/* THEME TOGGLE */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="
              w-10 h-10 rounded-full flex items-center justify-center
              bg-(--card) border border-gray-300 dark:border-gray-700
              text-primary shadow hover:shadow-lg transition
            "
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

        </div>
      </nav>
    </header>
  );
}
