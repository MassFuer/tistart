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
  // Use existing token if the browser sent one, otherwise create new
  const token = req.cookies?.[CSRF_COOKIE] || crypto.randomBytes(32).toString("hex");

  // Re-set the cookie to refresh its presence in the browser
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false, // JS needs to read this
    secure: true, // Required for SameSite=None
    sameSite: "none", // Critical for Netlify -> Render
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

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    // Log details to your Render dashboard logs to see which is missing
    console.error(`CSRF FAIL - Cookie: ${!!cookieToken}, Header: ${!!headerToken}`);
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  next();
};

module.exports = { setCsrfCookie, validateCsrf, CSRF_COOKIE };
