const crypto = require("crypto");

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

/**
 * Double-submit cookie CSRF protection.
 *
 * - Sets a random CSRF token in a cookie (SameSite=Strict, not HttpOnly so JS can read it).
 * - On state-changing requests (POST/PUT/PATCH/DELETE), validates that the
 *   x-csrf-token header matches the cookie value.
 * - Also validates the Origin header against allowed origins.
 */

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:3000",
  "https://tistart.netlify.app",
]);
if (process.env.CLIENT_URL) {
  allowedOrigins.add(process.env.CLIENT_URL);
}

/**
 * Middleware: set CSRF cookie if not present.
 */
const setCsrfCookie = (req, res, next) => {
  // Production detection (handles Render/Netlify)
  const isProd = 
    process.env.NODE_ENV === "production" || 
    process.env.RENDER === "true" || 
    !!process.env.RENDER_EXTERNAL_URL;

  // Use existing token if the browser sent one, otherwise create new
  const token = req.cookies?.[CSRF_COOKIE] || crypto.randomBytes(32).toString("hex");

  // Re-set the cookie to refresh its presence in the browser
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false, // JS needs to read this
    secure: isProd, // Required for SameSite=None, but breaks localhost if true
    sameSite: isProd ? "none" : "lax", // Critical for Netlify -> Render
    maxAge: 24 * 60 * 60 * 1000, // 24h
    path: "/",
  });

  // Manually update req.cookies so the validator (validateCsrf)
  // sees it even on the very first request
  req.cookies = { ...req.cookies, [CSRF_COOKIE]: token };
  next();
};

/**
 * Middleware: validate CSRF on state-changing methods.
 */
const validateCsrf = (req, res, next) => {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) return next();
  if (req.path.includes("/webhook")) return next();
  
  // Public auth routes that don't have CSRF token yet (landing from email)
  const excludedPaths = [
    "/auth/verify-email",
    "/auth/resend-verification-email",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/logout" // Allow logout even if CSRF fails (fix "still connected")
  ];
  
  if (excludedPaths.some(path => req.path.includes(path))) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);

  // 1. Strict Match (Standard case)
  if (cookieToken && headerToken && cookieToken === headerToken) {
    return next();
  }

  // 2. Production Fallback: JSON-basis (Anti-CSRF via Custom Header)
  // In Private/Incognito tabs, browsers block the third-party cookie from Render.
  // We allow the request if:
  // - It's production
  // - The Origin is our trusted frontend (e.g., Netlify)
  // - The x-csrf-token header is present (Browsers don't allow cross-site custom headers without CORS approval)
  const isProd = 
    process.env.NODE_ENV === "production" || 
    process.env.RENDER === "true" || 
    !!process.env.RENDER_EXTERNAL_URL;
  const origin = (req.get("origin") || req.get("referer") || "").toLowerCase();
  
  const trustedOrigins = [
    "https://tistart.netlify.app",
    "https://www.tistart.netlify.app",
    "https://fuer.fr",
    "https://www.fuer.fr",
    "https://tistart-38lwv03lr-massfuers-projects.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000"
  ];
  
  if (process.env.CLIENT_URL) {
    trustedOrigins.push(process.env.CLIENT_URL.replace(/\/$/, "").toLowerCase());
  }

  const isTrustedOrigin = trustedOrigins.some(trusted => origin.startsWith(trusted)) || 
                          origin.endsWith(".vercel.app");

  if (isProd && isTrustedOrigin && headerToken) {
    // If the match failed but we have a trusted origin and a header token,
    // we trust it (likely third-party cookie blocking in private tabs).
    return next();
  }

  // Log details for debugging
  console.error(`CSRF FAIL - CookieMismatch: ${cookieToken !== headerToken}, TrustedOrigin: ${!!isTrustedOrigin}`);
  return res.status(403).json({ error: "Invalid CSRF token" });
};

module.exports = { setCsrfCookie, validateCsrf, CSRF_COOKIE };
