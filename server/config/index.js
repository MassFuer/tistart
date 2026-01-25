const express = require("express");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const { sanitizeInput } = require("../utils/sanitize");

const FRONTEND_URL = process.env.CLIENT_URL || "http://localhost:5173";

module.exports = (app) => {
  // Trust proxy for deployment (Fly, Heroku, etc.)
  app.set("trust proxy", 1);

  // Security headers
  app.use(helmet());

  // CORS configuration with credentials for cookies
  app.use(
    cors({
      origin: [FRONTEND_URL],
      credentials: true, // Allow cookies to be sent
    })
  );

  // Logging in development
  app.use(logger("dev"));

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Sanitize input (XSS protection)
  app.use(sanitizeInput);

  // Cookie parser
  app.use(cookieParser());

  // Serve static files
  app.use(express.static("public"));
};
