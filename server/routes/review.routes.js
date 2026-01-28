const express = require("express");
const router = express.Router();

const Review = require("../models/Review.model");
const Artwork = require("../models/Artwork.model");
const Order = require("../models/Order.model");

const { isAuthenticated } = require("../middleware/jwt.middleware");
const { isAdminRole } = require("../middleware/role.middleware");
const { body } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const mongoose = require("mongoose");

// Helper to update artwork stats
const updateArtworkStats = async (artworkId) => {
  try {
     const stats = await Review.aggregate([
       { $match: { artwork: new mongoose.Types.ObjectId(artworkId) } },
       {
         $group: {
           _id: "$artwork",
           nRating: { $sum: 1 },
           avgRating: { $avg: "$rating" }
         }
       }
     ]);

     if (stats.length > 0) {
       await Artwork.findByIdAndUpdate(artworkId, {
         numOfReviews: stats[0].nRating,
         averageRating: stats[0].avgRating
       });
     } else {
       await Artwork.findByIdAndUpdate(artworkId, {
         numOfReviews: 0,
         averageRating: 0
       });
     }
  } catch(err) {
      console.error("Error updating artwork stats:", err);
  }
};

// GET /api/artworks/:artworkId/reviews - Get reviews for an artwork (public)
router.get("/artworks/:artworkId/reviews", async (req, res, next) => {
  try {
    const { artworkId } = req.params;
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Verify artwork exists
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({ error: "Artwork not found." });
    }

    const [reviews, total] = await Promise.all([
      Review.find({ artwork: artworkId })
        .populate("user", "firstName lastName profilePicture role")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments({ artwork: artworkId }),
    ]);

    res.status(200).json({
      data: reviews,
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

// POST /api/artworks/:artworkId/reviews - Create a review (authenticated)
router.post(
  "/artworks/:artworkId/reviews",
  isAuthenticated,
  [
    body("comment")
      .notEmpty()
      .withMessage("Comment is required")
      .isLength({ max: 1000 })
      .withMessage("Comment cannot exceed 1000 characters"),
    body("rating")
      .notEmpty()
      .withMessage("Rating is required")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("title")
      .optional()
      .isLength({ max: 100 })
      .withMessage("Title cannot exceed 100 characters"),
    validate,
  ],
  async (req, res, next) => {
    try {
      const { artworkId } = req.params;
      const { title, comment, rating } = req.body;
      const userId = req.payload._id;

      // Verify artwork exists
      const artwork = await Artwork.findById(artworkId);
      if (!artwork) {
        return res.status(404).json({ error: "Artwork not found." });
      }

      // Prevent artist from reviewing their own artwork
      if (artwork.artist.toString() === userId) {
        return res.status(403).json({ error: "You cannot review your own artwork." });
      }

      // Check if user has purchased this artwork
      const hasPurchased = await Order.exists({
        user: userId,
        "items.artwork": artworkId,
        status: { $in: ["paid", "shipped", "delivered"] },
      });

      // Create review
      const review = await Review.create({
        user: userId,
        artwork: artworkId,
        title: title?.trim(),
        comment: comment.trim(),
        rating: Number(rating),
        isVerified: !!hasPurchased,
      });

      // Update Artwork Stats
      await updateArtworkStats(artworkId);

      // Populate user info for response
      await review.populate("user", "firstName lastName profilePicture");

      res.status(201).json({
        message: "Review created successfully",
        data: review,
      });
    } catch (error) {
      // Handle duplicate review (unique index on user + artwork)
      if (error.code === 11000) {
        return res.status(400).json({ error: "You have already reviewed this artwork." });
      }
      next(error);
    }
  }
);

// PATCH /api/reviews/:id - Update a review (Author, Admin, or Owner)
router.patch(
  "/reviews/:id",
  isAuthenticated,
  [
    body("comment")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Comment cannot exceed 1000 characters"),
    body("rating")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("title")
      .optional()
      .isLength({ max: 100 })
      .withMessage("Title cannot exceed 100 characters"),
    validate,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.payload._id;
      const userRole = req.payload.role;

      const review = await Review.findById(id).populate("artwork");
      if (!review) {
        return res.status(404).json({ error: "Review not found." });
      }

      // Roles
      const isReviewAuthor = review.user.toString() === userId;
      const isAdmin = isAdminRole(userRole);
      const isArtworkOwner = review.artwork.artist.toString() === userId;

      // Permission Check: Author OR Admin OR Artwork Owner
      if (!isReviewAuthor && !isAdmin && !isArtworkOwner) {
        return res.status(403).json({ error: "Not authorized to update this review." });
      }

      // Update allowed fields
      const allowedFields = ["title", "comment", "rating"];
      const updateObj = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateObj[field] = field === "rating" ? Number(req.body[field]) : req.body[field]?.trim();
        }
      }

      const updatedReview = await Review.findByIdAndUpdate(id, updateObj, {
        new: true,
        runValidators: true,
      }).populate("user", "firstName lastName profilePicture");

      // Update Stats (using artwork id from original review)
      await updateArtworkStats(review.artwork._id);

      res.status(200).json({
        message: "Review updated successfully",
        data: updatedReview,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/reviews/:id - Delete a review (owner or admin)
router.delete("/reviews/:id", isAuthenticated, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.payload._id;
    const userRole = req.payload.role;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: "Review not found." });
    }

    // Check ownership or admin
    const isOwner = review.user.toString() === userId;
    const isAdmin = userRole === "admin" || userRole === "superAdmin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "You can only delete your own reviews." });
    }

    const artworkId = review.artwork;
    await Review.findByIdAndDelete(id);

    // Update Stats
    await updateArtworkStats(artworkId);

    res.status(200).json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
