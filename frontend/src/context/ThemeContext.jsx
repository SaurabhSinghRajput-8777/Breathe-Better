import { createContext, useContext, useEffect, useState } from "react";

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  const [city, setCity] = useState(
    localStorage.getItem("city") || "Delhi"
  );

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Persist city
  useEffect(() => {
    localStorage.setItem("city", city);
  }, [city]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, city, setCity }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook
export function useTheme() {
  return useContext(ThemeContext);
}
