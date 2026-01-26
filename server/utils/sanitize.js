const xss = require("xss");

// XSS filter options - allow some basic formatting but strip dangerous content
const xssOptions = {
  whiteList: {}, // No HTML tags allowed by default
  stripIgnoreTag: true, // Strip tags not in whitelist
  stripIgnoreTagBody: ["script", "style"], // Completely remove these tags and their content
};

const MAX_DEPTH = 10;

/**
 * Recursively sanitize all string values in an object
 * @param {any} obj - The object to sanitize
 * @param {number} depth - Current recursion depth
 * @returns {any} - The sanitized object
 */
const sanitizeObject = (obj, depth = 0) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Prevent stack overflow
  if (depth > MAX_DEPTH) {
    return null;
  }

  // Handle strings
  if (typeof obj === "string") {
    return xss(obj, xssOptions);
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  // Handle objects (but not Date, Buffer, ObjectId, etc.)
  if (typeof obj === "object" && obj.constructor === Object) {
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = sanitizeObject(obj[key], depth + 1);
    }
    return sanitized;
  }

  // Return other types as-is (numbers, booleans, dates, etc.)
  return obj;
};

/**
 * Express middleware to sanitize request body
 * Protects against XSS attacks by escaping HTML in user input
 */
const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Sanitize a single string value
 * @param {string} str - The string to sanitize
 * @returns {string} - The sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== "string") {
    return str;
  }
  return xss(str, xssOptions);
};

module.exports = {
  sanitizeObject,
  sanitizeInput,
  sanitizeString,
};
