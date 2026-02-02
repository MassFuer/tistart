const express = require("express");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
// Note: express-mongo-sanitize removed due to Express 5 incompatibility (req.query is read-only)
const { sanitizeInput } = require("../utils/sanitize");
const { setCsrfCookie, validateCsrf } = require("../middleware/csrf.middleware");

// Build allowed origins list - always include localhost for development
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://tistart.netlify.app",
  "https://www.tistart.netlify.app",
  "https://fuer.fr",
  "https://www.fuer.fr",
  "https://tistart.vercel.app",
  "https://www.tistart.vercel.app",
  "https://tistart-38lwv03lr-massfuers-projects.vercel.app",
];

// Add production URL if set
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL.replace(/\/$/, ""));
}

module.exports = (app) => {
  // Trust proxy for deployment (Fly, Heroku, etc.)
  app.set("trust proxy", 1);

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // CORS configuration with credentials for cookies
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Normalize origin: lowercase and remove trailing slash
        const normalizedOrigin = origin.toLowerCase().replace(/\/$/, "");

        const isTrustedOrigin =
          allowedOrigins.some((trusted) =>
            normalizedOrigin.startsWith(trusted.toLowerCase().replace(/\/$/, ""))
          ) ||
          normalizedOrigin.endsWith(".vercel.app") ||
          normalizedOrigin.endsWith(".netlify.app") ||
          normalizedOrigin.includes(".ts.net"); // Allow Tailscale/Homelab subdomains

        if (isTrustedOrigin) {
          callback(null, true);
        } else {
          console.warn(
            `CORS blocked for origin: ${origin}. Expected one of: ${allowedOrigins.join(", ")}`
          );
          const corsError = new Error("Not allowed by CORS");
          corsError.origin = origin;
          callback(corsError);
        }
      },
      credentials: true, // Allow cookies to be sent
    })
  );

  // Logging in development
  app.use(logger("dev"));

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Data sanitization against NoSQL query injection
  // Note: express-mongo-sanitize@2.2.0 is incompatible with Express 5 (req.query is read-only)
  // Using custom sanitization for req.body instead
  const sanitizeObject = (obj) => {
    if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (key.startsWith("$") || key.includes(".")) {
          delete obj[key];
        } else if (typeof obj[key] === "object") {
          sanitizeObject(obj[key]);
        }
      }
    }
    return obj;
  };

  app.use((req, res, next) => {
    if (req.body) sanitizeObject(req.body);
    next();
  });

  // Sanitize input (XSS protection)
  app.use(sanitizeInput);

  // Cookie parser
  app.use(cookieParser());

  // CSRF protection (double-submit cookie)
  app.use(setCsrfCookie);
  app.use(validateCsrf);

  // Serve static files
  app.use(express.static("public"));
};
