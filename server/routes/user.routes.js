const express = require("express");
const router = express.Router();

const User = require("../models/User.model");
const Artwork = require("../models/Artwork.model");
const Order = require("../models/Order.model");
const mongoose = require("mongoose");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { isAdmin, attachUser, isSuperAdmin } = require("../middleware/role.middleware");
const {
  uploadProfile,
  uploadLogo,
  processAndUploadProfile,
  processAndUploadLogo,
  checkStorageQuota,
  updateUserStorage,
  deleteFile,
} = require("../utils/r2");
const { sendArtistStatusEmail } = require("../utils/email");

// ==================== USER ROUTES ====================

// GET /api/users/profile - Get current user profile
router.get("/profile", isAuthenticated, attachUser, (req, res) => {
  const userResponse = { ...req.user.toObject() };
  delete userResponse.password;
  res.status(200).json({ data: userResponse });
});

// PATCH /api/users/profile - Update current user profile
router.patch("/profile", isAuthenticated, attachUser, async (req, res, next) => {
  try {
    const allowedFields = ["firstName", "lastName", "userName", "preferredLanguage"];
    const updateObj = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateObj[field] = req.body[field];
      }
    }

    if (Object.keys(updateObj).length === 0) {
      return res.status(400).json({ error: "No valid fields to update." });
    }

    // Check if username is taken
    if (updateObj.userName) {
      const existingUser = await User.findOne({
        userName: updateObj.userName.toLowerCase(),
        _id: { $ne: req.user._id },
      });
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken." });
      }
      updateObj.userName = updateObj.userName.toLowerCase();
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateObj, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json({ data: updatedUser });
  } catch (error) {
    next(error);
  }
});

// POST /api/users/profile/picture - Upload profile picture
router.post(
  "/profile/picture",
  isAuthenticated,
  attachUser,
  uploadProfile.single("profilePicture"),
  checkStorageQuota,
  processAndUploadProfile,
  async (req, res, next) => {
    try {
      if (!req.uploadedFile) {
        return res.status(400).json({ error: "No image provided." });
      }

      // Delete old profile picture if exists
      if (req.user.profilePicture) {
        await deleteFile(req.user.profilePicture, req.user._id.toString());
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { profilePicture: req.uploadedFile.url },
        { new: true }
      ).select("-password");

      // Update storage tracking
      await updateUserStorage(req.user._id.toString(), req.uploadedFile.size, "image");

      res.status(200).json({ data: updatedUser });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/users/profile/logo - Upload artist logo
router.post(
  "/profile/logo",
  isAuthenticated,
  attachUser,
  uploadLogo.single("logo"),
  checkStorageQuota,
  processAndUploadLogo,
  async (req, res, next) => {
    try {
      if (!req.uploadedFile) {
        return res.status(400).json({ error: "No image provided." });
      }

      // Only artists can upload logos
      if (req.user.role !== "artist" && req.user.artistStatus !== "verified") {
        return res.status(403).json({ error: "Only verified artists can upload logos." });
      }

      // Delete old logo if exists
      if (req.user.artistInfo?.logo) {
        await deleteFile(req.user.artistInfo.logo, req.user._id.toString());
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { "artistInfo.logo": req.uploadedFile.url },
        { new: true }
      ).select("-password");

      // Update storage tracking
      await updateUserStorage(req.user._id.toString(), req.uploadedFile.size, "image");

      res.status(200).json({ data: updatedUser });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/users/stats - Get user statistics for dashboard
router.get("/stats", isAuthenticated, attachUser, async (req, res, next) => {
  try {
    const user = req.user;
    const role = user.role;
    let userStats = user.stats;

    // Lazy Migration / Fallback: If stats are missing or not initialized
    if (!userStats || !userStats.initialized) {
      const userId = user._id;

      const [artworksCount, eventsCount, ordersCount, salesCount, ratingAgg] = await Promise.all([
        Artwork.countDocuments({ artist: userId }),
        mongoose.model("Event").countDocuments({ artist: userId }),
        Order.countDocuments({ user: userId }),
        Order.countDocuments({ "items.artist": userId }),
        mongoose.model("Review").aggregate([
          {
            $lookup: {
              from: "artworks",
              localField: "artwork",
              foreignField: "_id",
              as: "artwork",
            },
          },
          { $unwind: "$artwork" },
          { $match: { "artwork.artist": userId } },
          {
            $group: {
              _id: null,
              avgRating: { $avg: "$rating" },
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

      const avgRating =
        ratingAgg.length > 0 ? Math.round(ratingAgg[0].avgRating * 10) / 10 : 0;
      const reviewCount = ratingAgg.length > 0 ? ratingAgg[0].count : 0;

      userStats = {
        initialized: true,
        artworks: artworksCount,
        events: eventsCount,
        sales: salesCount,
        orders: ordersCount,
        avgRating,
        reviewCount,
        favorites: user.favorites ? user.favorites.length : 0,
        attending: 0, // Placeholder, calculated below
      };

      // Asynchronously save calculated stats to user profile
      User.findByIdAndUpdate(userId, { stats: userStats }).catch((err) =>
        console.error("Lazy stats sync failed:", err)
      );
    }

    const stats = {
      isArtist: role === "artist" || role === "admin" || role === "superAdmin",
    };

    // Artist Stats
    if (stats.isArtist) {
      // Use cached stats for performance where possible
      stats.artworks = userStats.artworks;
      stats.events = userStats.events;
      stats.sales = userStats.sales;
      stats.avgRating = userStats.avgRating;
      stats.reviewCount = userStats.reviewCount;

      // Calculate Total Revenue (not cached yet)
      const revenueAgg = await Order.aggregate([
        { $match: { status: { $in: ["paid", "shipped", "delivered"] }, "items.artist": user._id } },
        { $unwind: "$items" },
        { $match: { "items.artist": user._id } },
        { $group: { _id: null, total: { $sum: "$items.artistEarnings" } } }
      ]);
      stats.revenue = revenueAgg.length > 0 ? Math.round(revenueAgg[0].total * 100) / 100 : 0;
    }

    // User Stats
    stats.orders = userStats.orders;
    stats.favorites = req.user.favorites.length;
    
    // Always calculate attending count via query as hooks don't track attendees array changes
    stats.attending = await mongoose.model("Event").countDocuments({ "attendees.user": user._id });
    
    // Storage & Plan Stats
    if (stats.isArtist) {
        // Assuming req.user is attached and has storage field populated
        const storage = req.user.storage || {};
        stats.storageUsage = storage.totalBytes || 0;
        stats.storageQuota = storage.quotaBytes || 5 * 1024 * 1024 * 1024; // 5GB default
        stats.plan = req.user.subscriptionTier || 'free';
    }

    res.status(200).json({ data: stats });
  } catch (error) {
    next(error);
  }
});

// ==================== FAVORITES ====================

// GET /api/users/favorites - Get user's favorites
router.get("/favorites", isAuthenticated, attachUser, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "favorites",
        populate: {
          path: "artist",
          select: "firstName lastName userName artistInfo.companyName",
        },
      })
      .select("favorites");

    res.status(200).json({ data: user.favorites });
  } catch (error) {
    next(error);
  }
});

// POST /api/users/favorites/:artworkId - Add to favorites
router.post("/favorites/:artworkId", isAuthenticated, attachUser, async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.artworkId);

    if (!artwork) {
      return res.status(404).json({ error: "Artwork not found." });
    }

    // Check if already in favorites
    if (req.user.favorites.includes(req.params.artworkId)) {
      return res.status(400).json({ error: "Artwork already in favorites." });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $push: { favorites: req.params.artworkId },
    });

    res.status(200).json({ message: "Artwork added to favorites." });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/favorites/:artworkId - Remove from favorites
router.delete("/favorites/:artworkId", isAuthenticated, attachUser, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { favorites: req.params.artworkId },
    });

    res.status(200).json({ message: "Artwork removed from favorites." });
  } catch (error) {
    next(error);
  }
});

// ==================== ADMIN ROUTES ====================

// GET /api/users - Get all users (admin only)
router.get("/", isAuthenticated, isAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, artistStatus, search, sort = "-createdAt" } = req.query;

    // Build filter
    const filter = {};

    if (role) {
      filter.role = role;
    }

    if (artistStatus) {
      filter.artistStatus = artistStatus;
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter).select("-password").sort(sort).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id - Get single user (admin only)
router.get("/:id", isAuthenticated, isAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id - Update any user (admin only, superAdmin for admins)
router.patch("/:id", isAuthenticated, isAdmin, async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const currentUserRole = req.payload.role;
    const targetUserRole = targetUser.role;

    // Admin can't edit other admins or superAdmins
    if (
      currentUserRole === "admin" &&
      (targetUserRole === "admin" || targetUserRole === "superAdmin")
    ) {
      return res.status(403).json({ error: "Admins cannot edit other admin accounts." });
    }

    // SuperAdmin can't edit other superAdmins (only themselves via /profile)
    if (
      currentUserRole === "superAdmin" &&
      targetUserRole === "superAdmin" &&
      req.params.id !== req.payload._id
    ) {
      return res.status(403).json({ error: "Cannot edit other superAdmin accounts." });
    }

    // Allowed fields to update
    const allowedFields = [
      "firstName",
      "lastName",
      "userName",
      "email",
      "role",
      "artistStatus",
      "artistInfo",
    ];

    const updateObj = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        // Special handling for role changes
        if (field === "role") {
          const newRole = req.body[field];
          // Only superAdmin can assign admin or superAdmin roles
          if (
            (newRole === "admin" || newRole === "superAdmin") &&
            currentUserRole !== "superAdmin"
          ) {
            continue; // Skip this field
          }
        }
        updateObj[field] = req.body[field];
      }
    }

    if (Object.keys(updateObj).length === 0) {
      return res.status(400).json({ error: "No valid fields to update." });
    }

    // Check if username is taken
    if (updateObj.userName) {
      const existingUser = await User.findOne({
        userName: updateObj.userName.toLowerCase(),
        _id: { $ne: req.params.id },
      });
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken." });
      }
      updateObj.userName = updateObj.userName.toLowerCase();
    }

    // Check if email is taken
    if (updateObj.email) {
      const existingUser = await User.findOne({
        email: updateObj.email.toLowerCase(),
        _id: { $ne: req.params.id },
      });
      if (existingUser) {
        return res.status(400).json({ error: "Email already taken." });
      }
      updateObj.email = updateObj.email.toLowerCase();
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateObj, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json({ data: updatedUser });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id - Delete user (admin only, superAdmin for admins)
router.delete("/:id", isAuthenticated, isAdmin, async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const currentUserRole = req.payload.role;
    const targetUserRole = targetUser.role;

    // Cannot delete yourself
    if (req.params.id === req.payload._id) {
      return res.status(403).json({ error: "Cannot delete your own account." });
    }

    // Admin can't delete other admins or superAdmins
    if (
      currentUserRole === "admin" &&
      (targetUserRole === "admin" || targetUserRole === "superAdmin")
    ) {
      return res.status(403).json({ error: "Admins cannot delete admin accounts." });
    }

    // SuperAdmin can't delete other superAdmins
    if (currentUserRole === "superAdmin" && targetUserRole === "superAdmin") {
      return res.status(403).json({ error: "Cannot delete superAdmin accounts." });
    }

    // Delete user's profile picture if exists
    if (targetUser.profilePicture) {
      try {
        await deleteFile(targetUser.profilePicture, targetUser._id.toString());
      } catch (err) {
        console.error("Failed to delete profile picture:", err);
      }
    }

    // Delete user's logo if exists
    if (targetUser.artistInfo?.logo) {
      try {
        await deleteFile(targetUser.artistInfo.logo, targetUser._id.toString());
      } catch (err) {
        console.error("Failed to delete logo:", err);
      }
    }

    // TODO: Consider deleting user's artworks, events, reviews, etc.
    // For now, we just delete the user account
    // Artworks and events will have orphaned artist references

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id/artist-status - Update artist status (admin only)
router.patch("/:id/artist-status", isAuthenticated, isAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required." });
    }

    const validStatuses = ["none", "pending", "incomplete", "verified", "suspended"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Update status and role accordingly
    const updateObj = { artistStatus: status };

    // If setting to verified, ensure role is artist
    if (status === "verified" && user.role !== "artist") {
      updateObj.role = "artist";
    }

    // If setting to none, reset role to user
    if (status === "none") {
      updateObj.role = "user";
    }

    // Store previous status to check if it changed
    const previousStatus = user.artistStatus;

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateObj, {
      new: true,
    }).select("-password");

    // Send notification email if status changed
    if (status !== previousStatus && status !== "none") {
      try {
        await sendArtistStatusEmail(user.email, user.firstName, status);
      } catch (emailError) {
        console.error("Failed to send artist status email:", emailError);
        // Don't throw - status update already succeeded
      }
    }

    res.status(200).json({
      message: `Artist status updated to: ${status}`,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id/role - Update user role (admin only)
router.patch("/:id/role", isAuthenticated, isAdmin, async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: "Role is required." });
    }

    const validRoles = ["user", "artist", "admin", "superAdmin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Only superAdmin can assign superAdmin role
    if (role === "superAdmin" && req.user.role !== "superAdmin") {
      return res.status(403).json({
        error: "Only superAdmin can assign the superAdmin role.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select(
      "-password"
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({
      message: `User role updated to: ${role}`,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

// ==================== PUBLIC ARTIST PROFILE ====================

// GET /api/users/artist/:id - Get public artist profile
router.get("/artist/:id", async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      role: "artist",
      artistStatus: "verified",
    }).select("firstName lastName userName profilePicture artistInfo createdAt");

    if (!user) {
      return res.status(404).json({ error: "Artist not found." });
    }

    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/artists - Get all verified artists (public)
router.get("/artists/all", async (req, res, next) => {
  try {
    const { page = 1, limit = 12, search } = req.query;

    const filter = {
      role: "artist",
      artistStatus: "verified",
    };

    if (search) {
      filter.$or = [
        { "artistInfo.companyName": { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [artists, total] = await Promise.all([
      User.find(filter)
        .select(
          "firstName lastName userName profilePicture artistInfo.companyName artistInfo.tagline"
        )
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      data: artists,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
