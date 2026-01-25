const User = require("../models/User.model");

// Helper to check admin-level roles
const isAdminRole = (role) => role === "admin" || role === "superAdmin";

// Middleware to check if user is a verified artist
const isVerifiedArtist = async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Allow if user is admin/superAdmin OR (artist AND verified)
    if (!isAdminRole(user.role) && (user.role !== "artist" || user.artistStatus !== "verified")) {
      return res.status(403).json({
        error: "Access denied. Only verified artists can perform this action.",
      });
    }

    // Attach user to request for use in route handlers
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check if user is an admin (includes superAdmin)
const isAdmin = async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (!isAdminRole(user.role)) {
      return res.status(403).json({
        error: "Access denied. Admin privileges required.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check if user is a superAdmin (platform-level access)
const isSuperAdmin = async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.role !== "superAdmin") {
      return res.status(403).json({
        error: "Access denied. SuperAdmin privileges required.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check if user is at least an artist (any status except 'none')
const isArtist = async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.role !== "artist" && !isAdminRole(user.role)) {
      return res.status(403).json({
        error: "Access denied. Artist privileges required.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to attach user to request (useful for routes that need user data)
const attachUser = async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  isVerifiedArtist,
  isAdmin,
  isSuperAdmin,
  isArtist,
  attachUser,
  isAdminRole,
};
