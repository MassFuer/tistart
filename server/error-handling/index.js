const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

module.exports = (app) => {
  app.use((req, res, next) => {
    // this middleware runs whenever requested page is not available
    next(new AppError("This route does not exist", 404));
  });

  app.use((err, req, res, next) => {
    // Log error using Winston
    logger.error(`${req.method} ${req.path} - ${err.message}`, {
      stack: err.stack,
      statusCode: err.statusCode || 500,
    });

    // 1. Check if the response has already been sent
    if (res.headersSent) {
      return next(err);
    }

    // 2. Handle 401 Unauthorized (e.g. invalid JWT from express-jwt)
    if (err.status === 401) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid or missing authentication token.",
      });
    }

    // 3. Handle Mongoose Validation Errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({
        status: "fail",
        message: messages.join(". "),
      });
    }

    // 4. Handle MongoDB Duplicate Key Errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({
        status: "fail",
        message: `A record with that ${field} already exists.`,
      });
    }

    // 5. Handle Operational Errors (AppError)
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // 6. Default to 500 Internal Server Error (Programming or Unknown Error)
    res.status(500).json({
      status: "error",
      message: "Internal server error.",
    });
  });
};
