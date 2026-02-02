import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const ScrollManager = () => {
  const { pathname, key } = useLocation();
  const navType = useNavigationType();

  // Set scroll restoration to manual to take full control
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Save scroll position whenever the user scrolls
  useEffect(() => {
    const handleScroll = () => {
      const pos = window.scrollY.toString();
      sessionStorage.setItem(`scroll-pos-${key}`, pos);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [key]);

  // Handle restoration or scrolling to top
  useEffect(() => {
    if (navType === "POP") {
      const savedPos = sessionStorage.getItem(`scroll-pos-${key}`);
      if (savedPos !== null) {
        const targetScroll = parseInt(savedPos, 10);
        
        let attempts = 0;
        const maxAttempts = 50; // Try for about 800ms

        const performRestoration = () => {
           const scrollHeight = document.documentElement.scrollHeight;
           const clientHeight = window.innerHeight;
           
           if (scrollHeight >= targetScroll + clientHeight || attempts >= maxAttempts) {
              window.scrollTo({
                top: targetScroll,
                behavior: "instant",
              });
           } else {
              attempts++;
              requestAnimationFrame(performRestoration);
           }
        };

        requestAnimationFrame(performRestoration);
      }
    } else {
      // New navigation: always go to top
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname, navType, key]);

  return null;
};

export default ScrollManager;
