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
      
      if (theme.fontFamily) {
          // If system-ui is selected, use the standard system font stack
          // Otherwise use the font name fallbacked to sans-serif
          const fontValue = theme.fontFamily === 'system-ui' 
            ? "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
            : `"${theme.fontFamily}", sans-serif`;
            
          root.style.setProperty("--font-sans", fontValue);
      }

      if (theme.cssVars) {
          const unsafeKeys = [
              "--background", "--foreground", 
              "--card", "--card-foreground",
              "--popover", "--popover-foreground",
              "--secondary", "--secondary-foreground",
              "--muted", "--muted-foreground",
              "--accent", "--accent-foreground",
              "--destructive", "--destructive-foreground",
              "--input", "--border", "--ring"
          ];
          // We decided to only allow BRAND colors for now to preserve dark mode integrity
          // Or we can allow specific ones.
          // The critical ones to block are background/foreground/card.
          // Let's block the structural ones.
          
          const structuralKeys = ["--background", "--foreground", "--card", "--card-foreground", "--popover", "--popover-foreground"];

          Object.entries(theme.cssVars).forEach(([key, value]) => {
              if (!structuralKeys.includes(key)) {
                  root.style.setProperty(key, value);
              }
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
