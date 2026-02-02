module.exports = (app) => {
  app.use((req, res, next) => {
    // this middleware runs whenever requested page is not available
    res.status(404).json({ message: "This route does not exist" });
  });

  app.use((err, req, res, next) => {
    // whenever you call next(err), this middleware will handle the error
    // always logs the error
    console.error("ERROR", req.method, req.path, err);

    // 1. Check if the response has already been sent
    if (res.headersSent) {
      return next(err);
    }

    // 2. Handle CORS Errors (from config/index.js callback)
    if (err.message === "Not allowed by CORS") {
      return res.status(403).json({
        error: "Forbidden",
        message: `CORS policy blocked this request. Origin: ${err.origin || "unknown"} is not in allowedOrigins.`,
      });
    }

    // 3. Handle 401 Unauthorized (e.g. invalid JWT from express-jwt)
    if (err.status === 401) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or missing authentication token.",
      });
    }

    // 3. Handle Mongoose Validation Errors
    if (err.name === "ValidationError") {
      // Extract specific messages from the validation error
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({
        error: "Validation Error",
        message: messages.join(". "),
      });
    }

    // 4. Handle MongoDB Duplicate Key Errors (code 11000)
    if (err.code === 11000) {
      // Extract the field that caused the duplicate error
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({
        error: "Duplicate Record",
        message: `A record with that ${field} already exists.`,
      });
    }

    // 5. Default to 500 Internal Server Error
    res.status(500).json({
      message: "Internal server error. Check the server console",
    });
  });
};
