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
      
      // 1. Base Variables (Primary, Radius, Fonts) - Shared or specific?
      // Usually Primary brand color is shared, but we could split it if needed.
      // For now, keep Primary/Radius/Font global as "Brand Identity".

      if (theme.primary) {
          root.style.setProperty("--primary", theme.primary);
          // Set primary-foreground from config, or default to light text for dark buttons
          if (theme.primaryForeground) {
              root.style.setProperty("--primary-foreground", theme.primaryForeground);
          } else {
              // Default: light text works on most primary colors
              root.style.setProperty("--primary-foreground", "0 0% 98%");
          }
      }

      if (theme.radius) {
          root.style.setProperty("--radius", theme.radius);
      }
      
      if (theme.fontFamily) {
          const fontValue = theme.fontFamily === 'system-ui' 
            ? "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
            : `"${theme.fontFamily}", sans-serif`;
          root.style.setProperty("--font-sans", fontValue);
      }

      // 2. Mode-Specific Overrides
      // We check the LOCAL state `isDarkMode` to decide which set to apply.
      // BUT, `applyTheme` might be called before `isDarkMode` state is settled or when it changes.
      // The `useEffect` below handles the change.
      
      const varsToApply = isDarkMode 
        ? (theme.cssVarsDark || {}) 
        : (theme.cssVarsLight || {});

      Object.entries(varsToApply).forEach(([key, value]) => {
          root.style.setProperty(key, value);
      });
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
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, setDarkMode: setIsDarkMode, updateThemePreview, themeSettings }}>
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
