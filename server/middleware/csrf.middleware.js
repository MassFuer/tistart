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
  if (!req.cookies?.[CSRF_COOKIE]) {
    const token = crypto.randomBytes(32).toString("hex");
    const isProd = process.env.NODE_ENV === "production";
    
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false, // JS needs to read this (or we return it in JSON)
      secure: isProd,
      // 'none' allows cross-domain cookies, 'lax' is better for dev
      sameSite: isProd ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24h
      path: "/",
    });
  }
  next();
};

/**
 * Middleware: validate CSRF on state-changing methods.
 */
const validateCsrf = (req, res, next) => {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) return next();

  // Skip for webhook routes (they use their own signature verification)
  if (req.path.includes("/webhook")) return next();

  // 1. Origin validation
  const origin = req.get("origin");
  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ error: "Invalid origin" });
  }

  // 2. Double-submit cookie check
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }

  next();
};

module.exports = { setCsrfCookie, validateCsrf, CSRF_COOKIE };