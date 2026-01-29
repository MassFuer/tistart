import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  // Disable browser's default scroll restoration to avoid conflicts
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Only scroll to top on PUSH or REPLACE (new navigations)
    // POP means going back/forward in history, where we want restoration
    if (navType !== "POP") {
      window.scrollTo(0, 0);
    }
  }, [pathname, navType]);

  return null;
};

export default ScrollToTop;
