"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type ThemeType = "dark" | "light-glass" | "system";
type ResolvedTheme = "dark" | "light-glass";

type ThemeContextType = {
  theme: ThemeType;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeType) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function getSystemPreference(): ResolvedTheme {
  return "dark"; // Default to dark universally
}

function resolveTheme(theme: ThemeType): ResolvedTheme {
  if (theme === "system") return getSystemPreference();
  return theme;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeRaw] = useState<ThemeType>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");

  // Apply theme to DOM
  const applyTheme = useCallback((resolved: ResolvedTheme) => {
    setResolvedTheme(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
    // Update meta theme-color for mobile browsers
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", resolved === "light-glass" ? "#f1f5f9" : "#0b0f19");
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    const saved = localStorage.getItem("boshliq-theme") as ThemeType | null;
    const initial = saved || "dark";
    setThemeRaw(initial);
    applyTheme(resolveTheme(initial));

    // Listen for OS theme changes if in "system" mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => {
      const current = localStorage.getItem("boshliq-theme") as ThemeType;
      if (current === "system") {
        applyTheme(getSystemPreference());
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [applyTheme]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeRaw(newTheme);
    localStorage.setItem("boshliq-theme", newTheme);
    applyTheme(resolveTheme(newTheme));
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
