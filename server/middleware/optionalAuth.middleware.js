const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

/**
 * Middleware that attempts to decode the JWT token but does not fail if it's missing or invalid.
 * Used for public routes that have enhanced content for logged-in users (like checking for video purchases).
 */
const optionalAuth = async (req, res, next) => {
  const token = req.cookies?.authToken || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    req.payload = decoded;
    
    const user = await User.findById(decoded._id).select("-password");
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // If token is invalid or expired, we just proceed as unauthenticated
    console.debug("Optional auth check skipped:", error.message);
  }
  
  next();
};

module.exports = { optionalAuth };
