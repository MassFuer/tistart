import { createContext, useState, useEffect, useContext } from "react";
import { platformAPI } from "../services/api";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [themeSettings, setThemeSettings] = useState(null);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const response = await platformAPI.getConfig();
        const theme = response.data.data.theme;
        setThemeSettings(theme);
        applyTheme(theme);
      } catch (error) {
        console.error("Failed to load theme config", error);
      }
    };
    fetchTheme();
  }, []);

  const applyTheme = (theme) => {
      if (!theme) return;
      const root = document.documentElement;

      if (theme.primary) {
          root.style.setProperty("--primary", theme.primary);
          // We might want to auto-calculate ring/foreground if not provided,
          // but for now assume simple override
          root.style.setProperty("--ring", theme.primary);
      }

      if (theme.radius) {
          root.style.setProperty("--radius", theme.radius);
      }

      if (theme.cssVars) {
          Object.entries(theme.cssVars).forEach(([key, value]) => {
              root.style.setProperty(key, value);
          });
      }
  };

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));

    if (isDarkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.classList.remove("dark");
    }

    // Re-apply theme settings when mode changes (if needed, though CSS vars usually persist on root)
    if (themeSettings) {
        applyTheme(themeSettings);
    }
  }, [isDarkMode, themeSettings]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Helper to update theme temporarily (preview)
  const updateThemePreview = (newTheme) => {
      applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, updateThemePreview, themeSettings }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
