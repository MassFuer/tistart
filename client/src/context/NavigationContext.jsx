import { createContext, useContext, useCallback, useEffect } from "react";
import { useNavigate as useRouterNavigate, useLocation } from "react-router-dom";

const NavigationContext = createContext();

const SCROLL_KEY = "scrollPositions";

// Helper to get scroll positions from sessionStorage
const getScrollPositions = () => {
  try {
    const stored = sessionStorage.getItem(SCROLL_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Helper to save scroll positions to sessionStorage
const setScrollPositions = (positions) => {
  try {
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(positions));
  } catch {
    // Storage full or unavailable
  }
};

export const NavigationProvider = ({ children }) => {
  const routerNavigate = useRouterNavigate();
  const location = useLocation();

  // Save scroll position for current path
  const saveScrollPosition = useCallback((path = window.location.pathname) => {
    const positions = getScrollPositions();
    positions[path] = window.scrollY;
    setScrollPositions(positions);
  }, []);

  // Get saved scroll position for a path
  const getScrollPosition = useCallback((path) => {
    const positions = getScrollPositions();
    return positions[path] || 0;
  }, []);

  // Clear scroll position for a path
  const clearScrollPosition = useCallback((path) => {
    const positions = getScrollPositions();
    delete positions[path];
    setScrollPositions(positions);
  }, []);

  // Navigate back with scroll restoration
  const goBackWithScroll = useCallback((fallbackPath) => {
    // Try browser history first
    if (window.history.length > 1) {
      window.history.back();
    } else {
      routerNavigate(fallbackPath);
    }
  }, [routerNavigate]);

  // Auto-save scroll position before leaving a page
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    // Save on browser navigation (back/forward buttons)
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [saveScrollPosition]);

  // Save scroll position when route changes (before leaving current page)
  useEffect(() => {
    // This runs when location changes, save the scroll for the PREVIOUS path
    return () => {
      saveScrollPosition();
    };
  }, [location.pathname, saveScrollPosition]);

  return (
    <NavigationContext.Provider value={{
      saveScrollPosition,
      getScrollPosition,
      clearScrollPosition,
      goBackWithScroll
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("useNavigation must be used within NavigationProvider");
  return context;
};