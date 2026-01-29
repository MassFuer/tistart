// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");

// Swagger documentation
const swaggerUi = require("swagger-ui-express");

const app = express();

// 💳 Stripe webhook needs raw body - must be BEFORE express.json() middleware
const stripeWebhook = require("./routes/stripe-webhook.routes");
app.use("/api/payments/webhook", stripeWebhook);

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

// Rate limiting for API routes
const { apiLimiter } = require("./middleware/rateLimit.middleware");
app.use("/api", apiLimiter);

// 🏥 Health check route
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Nemesis API is running",
    version: "1.0.0",
    documentation: "/api-docs",
    endpoints: {
      auth: "/auth",
      artworks: "/api/artworks",
      events: "/api/events",
      users: "/api/users",
      platform: "/api/platform",
    },
    timestamp: new Date().toISOString(),
  });
});

// 👇 Start handling routes here
const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const artworkRoutes = require("./routes/artwork.routes");
app.use("/api/artworks", artworkRoutes);

const eventRoutes = require("./routes/event.routes");
app.use("/api/events", eventRoutes);

const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);

const cartRoutes = require("./routes/cart.routes");
app.use("/api/cart", cartRoutes);

const orderRoutes = require("./routes/order.routes");
app.use("/api/orders", orderRoutes);

const reviewRoutes = require("./routes/review.routes");
app.use("/api", reviewRoutes);

const platformRoutes = require("./routes/platform.routes");
app.use("/api/platform", platformRoutes);

const videoRoutes = require("./routes/video.routes");
app.use("/api/videos", videoRoutes);

const paymentRoutes = require("./routes/payment.routes");
app.use("/api/payments", paymentRoutes);

const geocodeRoutes = require("./routes/geocode.routes");
app.use("/api/geocode", geocodeRoutes);

const conversationRoutes = require("./routes/conversation.routes");
app.use("/api/conversations", conversationRoutes);

const translationRoutes = require("./routes/translation.routes");
app.use("/api/translations", translationRoutes);

// 📚 Swagger API Documentation
try {
  const swaggerDocument = require("./swagger-output.json");
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.log("Swagger docs not generated yet. Run: npm run swagger");
}

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;
