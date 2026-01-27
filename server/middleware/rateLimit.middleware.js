const rateLimit = require("express-rate-limit");

// Rate limiter for authentication endpoints (login, signup, password reset)
// Strict limit: 5 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: {
    error: "Too many attempts. Please try again in 5 minutes.",
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
});

// Rate limiter for general API endpoints
// More lenient: 60 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: {
    error: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for sensitive operations (password change, email change)
// Medium limit: 3 requests per hour per IP
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: "Too many sensitive operations. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for cart operations (add, update, remove)
// Prevents cart manipulation abuse: 30 requests per minute per IP
const cartLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    error: "Too many cart operations. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for order creation (checkout)
// Strict limit to prevent order spam: 5 orders per hour per IP
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    error: "Too many orders placed. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true, // Don't count failed checkout attempts
});

// Rate limiter for purchase operations (instant video purchase)
// Prevents purchase spam: 10 purchases per hour per IP
const purchaseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    error: "Too many purchase attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
});

module.exports = {
  authLimiter,
  apiLimiter,
  sensitiveLimiter,
  cartLimiter,
  orderLimiter,
  purchaseLimiter,
};
