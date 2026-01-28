const express = require("express");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
// Note: express-mongo-sanitize removed due to Express 5 incompatibility (req.query is read-only)
const { sanitizeInput } = require("../utils/sanitize");

// Build allowed origins list - always include localhost for development
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
];

// Add production URL if set
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

module.exports = (app) => {
  // Trust proxy for deployment (Fly, Heroku, etc.)
  app.set("trust proxy", 1);

  // Security headers
  app.use(helmet());

  // CORS configuration with credentials for cookies
  app.use(
    cors({
      origin: allowedOrigins,
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
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
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

  // Serve static files
  app.use(express.static("public"));
};
