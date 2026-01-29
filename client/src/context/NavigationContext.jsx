import { createContext, useContext, useCallback, useEffect, useLayoutEffect, useState, useRef } from "react";
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
  const [isNavbarHidden, setIsNavbarHidden] = useState(false);
  const scrollRef = useRef(0);

  // Track scroll position continuously to avoid reading 0 during unmount/transition
  useEffect(() => {
    const handleScroll = () => {
       scrollRef.current = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Save scroll position for current path
  const saveScrollPosition = useCallback((path = window.location.pathname) => {
    const positions = getScrollPositions();
    // Use ref value if window.scrollY is 0 (suspect), or just always use ref?
    // Using ref is safer against browser auto-scroll-to-top race conditions.
    // However, if user actually scrolled to 0, ref is 0. Correct.
    positions[path] = scrollRef.current;
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
  useLayoutEffect(() => {
    // This runs when location changes.
    // We want to save the scroll for the *previous* path (which is what location.pathname was before this update?)
    // Wait, location.pathname IS the new path here.
    // We need to save for the OLD path.
    // How do we get the old path?
    // We can track previous path in a ref.
    
    // Actually, the cleanup function of the PREVIOUS effect instance (rendering with OLD path) runs.
    // So `location.pathname` in the closure of the cleanup function is the OLD path.
    // So simple cleanup is correct.
    
    return () => {
      saveScrollPosition();
    };
  }, [location.pathname, saveScrollPosition]);

  return (
    <NavigationContext.Provider value={{
      saveScrollPosition,
      getScrollPosition,
      clearScrollPosition,
      goBackWithScroll,
      isNavbarHidden,
      setIsNavbarHidden
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