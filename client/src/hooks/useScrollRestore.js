import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useNavigation } from "../context/NavigationContext";

export const useScrollRestore = (isReady = true) => {
  const location = useLocation();
  const { getScrollPosition } = useNavigation();
  const hasRestored = useRef(false);
  const locationKey = useRef(location.key);

  // Reset when location changes
  useEffect(() => {
    if (locationKey.current !== location.key) {
      hasRestored.current = false;
      locationKey.current = location.key;
    }
  }, [location.key]);

  useEffect(() => {
    // Only restore once per navigation, and only when ready
    if (hasRestored.current || !isReady) return;

    // Check for scroll position in location state (from goBackWithScroll)
    const stateScroll = location.state?._scrollY;

    // Check for saved scroll position in sessionStorage
    const savedScroll = getScrollPosition(location.pathname);

    const scrollY = typeof stateScroll === "number" ? stateScroll : savedScroll;

    if (scrollY > 0) {
      // Small delay to ensure DOM is ready after data load
      const timer = setTimeout(() => {
        window.scrollTo({ top: scrollY, behavior: "instant" });
        hasRestored.current = true;
      }, 50);

      return () => clearTimeout(timer);
    } else {
      hasRestored.current = true;
    }
  }, [location.key, location.state, location.pathname, getScrollPosition, isReady]);
};