const express = require("express");
const router = express.Router();

const Artwork = require("../models/Artwork.model");
const Order = require("../models/Order.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { isVerifiedArtist, isAdminRole } = require("../middleware/role.middleware");
const {
  uploadArtwork,
  uploadVideo,
  processAndUploadArtwork,
  processAndUploadVideo,
  checkStorageQuota,
  updateUserStorage,
  deleteFile,
  processImage,
  uploadToR2,
  generateFilename,
  IMAGE_TRANSFORMS,
} = require("../utils/r2");
const { body } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");

// GET /api/artworks - Get all artworks (public)
router.get("/", async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      artist,
      materials,
      colors,
      isForSale,
      sort = "-createdAt",
      search,
    } = req.query;

    // Build filter object
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (artist) {
      filter.artist = artist;
    }

    if (materials) {
      filter.materialsUsed = materials;
    }

    if (colors) {
      filter.colors = colors;
    }

    if (isForSale !== undefined) {
      filter.isForSale = isForSale === "true";
    }

    if (search) {
      // Optimized search using N-grams (handles substring matching efficiently)
      const searchTokens = search
        .toLowerCase()
        .trim()
        .split(/[\s\-_.,;?!]+/);
      const validTokens = searchTokens.filter((t) => t.length > 0);

      if (validTokens.length > 0) {
        // If query contains very short tokens (<3 chars), fallback to regex
        // because we only index 3-grams and above for performance.
        const hasSmallTokens = validTokens.some((t) => t.length < 3);

        if (hasSmallTokens) {
          const searchRegex = new RegExp(search, "i");
          // Use the pre-computed search string which includes title, desc, and artist
          filter.searchString = { $regex: searchRegex };
        } else {
          // Use n-gram index for fast substring search
          // $all ensures that for "blue sky", we find docs with "blue" AND "sky"
          filter.searchKeywords = { $all: validTokens };
        }
      }
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const [artworks, total] = await Promise.all([
      Artwork.find(filter)
        .populate("artist", "firstName lastName userName artistInfo.companyName profilePicture")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Artwork.countDocuments(filter),
    ]);

    res.status(200).json({
      data: artworks,
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

// GET /api/artworks/artist/stats - Get artist artworks with sales stats (verified artist)
router.get("/artist/stats", isAuthenticated, isVerifiedArtist, async (req, res, next) => {
  try {
    const artistId = req.user._id;

    // 1. Aggregate Orders to get Sales & Revenue per Artwork
    const orderStats = await Order.aggregate([
      {
        $match: {
          "items.artist": artistId,
          status: { $in: ["paid", "shipped", "delivered"] }, // Only count completed sales
        },
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.artist": artistId,
        },
      },
      {
        $group: {
          _id: "$items.artwork",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.artistEarnings" }, // Use pre-calculated earnings
        },
      },
    ]);

    // Create a map for easy lookup
    const statsMap = {};
    let totalArtistRevenue = 0;
    let totalItemsSold = 0;

    orderStats.forEach((stat) => {
      statsMap[stat._id.toString()] = {
        sold: stat.totalSold,
        revenue: stat.totalRevenue,
      };
      totalArtistRevenue += stat.totalRevenue;
      totalItemsSold += stat.totalSold;
    });

    // 2. Fetch all artworks by this artist
    const artworks = await Artwork.find({ artist: artistId }).sort("-createdAt");

    // 3. Merge stats
    const artworksWithStats = artworks.map((artwork) => {
      const stat = statsMap[artwork._id.toString()] || { sold: 0, revenue: 0 };
      return {
        ...artwork.toObject(),
        stats: {
          totalSold: stat.sold,
          totalRevenue: stat.revenue,
        },
      };
    });

    // 4. Calculate Overall KPIs
    const totalArtworks = artworks.length;
    const totalReviews = artworks.reduce((acc, curr) => acc + (curr.numOfReviews || 0), 0);
    // Weighted average rating
    const totalRatingSum = artworks.reduce((acc, curr) => acc + ((curr.averageRating || 0) * (curr.numOfReviews || 0)), 0);
    const avgRating = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : 0;

    res.status(200).json({
      data: artworksWithStats,
      kpis: {
        totalRevenue: totalArtistRevenue,
        totalSold: totalItemsSold,
        totalArtworks,
        totalReviews,
        avgRating: Number(avgRating),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/artworks/:id - Get single artwork (public)
router.get("/:id", async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id).populate(
      "artist",
      "firstName lastName userName artistInfo profilePicture"
    );

    if (!artwork) {
      return res.status(404).json({ error: "Artwork not found." });
    }

    res.status(200).json({ data: artwork });
  } catch (error) {
    next(error);
  }
});

// POST /api/artworks - Create artwork (verified artists only)
router.post(
  "/",
  isAuthenticated,
  isVerifiedArtist,
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("price").isNumeric().withMessage("Price must be a number"),
    body("category").notEmpty().withMessage("Category is required"),
    validate,
  ],
  async (req, res, next) => {
    try {
      const {
        title,
        description,
        originalPrice,
        price,
        isForSale,
        category,
        materialsUsed,
        colors,
        dimensions,
        totalInStock,
      } = req.body;

      // Determine artist ID:
      // If admin and artist ID provided in body, use that.
      // Otherwise default to current user ID.
      let artistId = req.user._id;
      if (req.user.role === "admin" && req.body.artist) {
        artistId = req.body.artist;
      }

      const artwork = await Artwork.create({
        title,
        description,
        artist: artistId,
        originalPrice,
        price,
        isForSale: isForSale !== undefined ? isForSale : true,
        category,
        materialsUsed: materialsUsed || [],
        colors: colors || [],
        dimensions: dimensions || {},
        totalInStock: totalInStock || 1,
      });

      res.status(201).json({ data: artwork });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/artworks/:id - Update artwork (owner only)
router.patch("/:id", isAuthenticated, isVerifiedArtist, async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({ error: "Artwork not found." });
    }

    // Check if user is the owner OR admin
    if (req.user.role !== "admin" && artwork.artist.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only update your own artworks." });
    }

    const allowedFields = [
      "title",
      "description",
      "originalPrice",
      "price",
      "isForSale",
      "category",
      "materialsUsed",
      "colors",
      "dimensions",
      "totalInStock",
      "images",
    ];

    const updateObj = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateObj[field] = req.body[field];
      }
    }

    // Handle image deletions - find images that were removed
    if (req.body.images !== undefined) {
      const oldImages = artwork.images || [];
      const newImages = req.body.images || [];
      const removedImages = oldImages.filter((img) => !newImages.includes(img));

      // Delete removed images from R2
      const artistId = artwork.artist.toString();
      for (const imageUrl of removedImages) {
        await deleteFile(imageUrl, artistId);
      }
    }

    // Handle video settings separately to avoid overwriting the video URL
    // Only update isPaid if videoIsPaid is provided
    if (req.body.videoIsPaid !== undefined && artwork.video?.url) {
      updateObj["video.isPaid"] = req.body.videoIsPaid;
    }

    // Handle video removal (user clicked remove on existing video)
    if (req.body.removeVideo === true && artwork.video?.url) {
      // Delete video files from storage
      const artistId = artwork.artist.toString();
      await deleteFile(artwork.video.url, artistId);
      if (artwork.video.thumbnailUrl) {
        await deleteFile(artwork.video.thumbnailUrl, artistId);
      }
      if (artwork.video.previewUrl) {
        await deleteFile(artwork.video.previewUrl, artistId);
      }
      // Remove video from artwork
      updateObj.video = null;
    }

    const updatedArtwork = await Artwork.findByIdAndUpdate(req.params.id, updateObj, {
      new: true,
      runValidators: true,
    }).populate("artist", "firstName lastName userName artistInfo.companyName");

    res.status(200).json({ data: updatedArtwork });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/artworks/:id - Delete artwork (owner only)
router.delete("/:id", isAuthenticated, isVerifiedArtist, async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({ error: "Artwork not found." });
    }

    // Check if user is the owner OR admin/superAdmin
    if (!isAdminRole(req.user.role) && artwork.artist.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only delete your own artworks." });
    }

    // Delete associated files from R2 and update storage
    const artistId = artwork.artist.toString();
    for (const imageUrl of artwork.images) {
      await deleteFile(imageUrl, artistId);
    }

    // Delete video files if any
    if (artwork.video?.url) {
      await deleteFile(artwork.video.url, artistId);
    }
    if (artwork.video?.thumbnailUrl) {
      await deleteFile(artwork.video.thumbnailUrl, artistId);
    }
    if (artwork.video?.previewUrl) {
      await deleteFile(artwork.video.previewUrl, artistId);
    }

    await Artwork.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Artwork deleted successfully." });
  } catch (error) {
    next(error);
  }
});

// POST /api/artworks/:id/images - Upload images (owner only)
router.post(
  "/:id/images",
  isAuthenticated,
  isVerifiedArtist,
  uploadArtwork.array("images", 5),
  checkStorageQuota,
  processAndUploadArtwork,
  async (req, res, next) => {
    try {
      const artwork = await Artwork.findById(req.params.id);

      if (!artwork) {
        return res.status(404).json({ error: "Artwork not found." });
      }

      // Check if user is the owner OR admin/superAdmin
      if (!isAdminRole(req.user.role) && artwork.artist.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "You can only upload images to your own artworks." });
      }

      if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
        return res.status(400).json({ error: "No images provided." });
      }

      // Get URLs from uploaded files
      const imageUrls = req.uploadedFiles.map((file) => file.url);

      // Add to existing images
      artwork.images.push(...imageUrls);
      await artwork.save();

      // Update storage tracking for the artist
      const artistId = artwork.artist.toString();
      for (const file of req.uploadedFiles) {
        await updateUserStorage(artistId, file.size, file.type);
      }

      res.status(200).json({ data: artwork });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/artworks/:id/video - Upload video (owner only)
router.post(
  "/:id/video",
  isAuthenticated,
  isVerifiedArtist,
  uploadVideo.single("video"),
  checkStorageQuota,
  processAndUploadVideo,
  async (req, res, next) => {
    try {
      const artwork = await Artwork.findById(req.params.id);

      if (!artwork) {
        return res.status(404).json({ error: "Artwork not found." });
      }

      // Check if user is the owner OR admin
      if (req.user.role !== "admin" && artwork.artist.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "You can only upload videos to your own artworks." });
      }

      if (!req.uploadedVideo) {
        return res.status(400).json({ error: "No video provided." });
      }

      // Delete old video if exists
      if (artwork.video?.url) {
        await deleteFile(artwork.video.url, artwork.artist.toString());
      }

      // Update artwork with video info
      artwork.video = {
        url: req.uploadedVideo.url,
        isPaid: req.body.isPaid === "true" || req.body.isPaid === true,
        fileSize: req.uploadedVideo.size,
        // Duration will be set by frontend after upload (via metadata)
        duration: req.body.duration ? Number(req.body.duration) : undefined,
      };
      await artwork.save();

      // Update storage tracking
      await updateUserStorage(artwork.artist.toString(), req.uploadedVideo.size, "video");

      res.status(200).json({ data: artwork });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/artworks/:id/video/thumbnail - Upload video thumbnail
router.post(
  "/:id/video/thumbnail",
  isAuthenticated,
  isVerifiedArtist,
  uploadArtwork.single("thumbnail"),
  async (req, res, next) => {
    try {
      const artwork = await Artwork.findById(req.params.id);

      if (!artwork) {
        return res.status(404).json({ error: "Artwork not found." });
      }

      if (req.user.role !== "admin" && artwork.artist.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "You can only update your own artworks." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No thumbnail provided." });
      }

      // Delete old thumbnail if exists
      if (artwork.video?.thumbnailUrl) {
        await deleteFile(artwork.video.thumbnailUrl, artwork.artist.toString());
      }

      // Process and upload thumbnail
      const processed = await processImage(req.file.buffer, IMAGE_TRANSFORMS.thumbnail);
      const folder = `videos/${artwork.artist}/thumbnails`;
      const key = generateFilename("thumbnail.webp", folder);
      const url = await uploadToR2(processed.buffer, key, "image/webp");

      // Update artwork
      artwork.video = {
        ...artwork.video,
        thumbnailUrl: url,
      };
      await artwork.save();

      await updateUserStorage(artwork.artist.toString(), processed.size, "image");

      res.status(200).json({ data: artwork });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/artworks/artist/:artistId - Get artworks by artist (public)
router.get("/artist/:artistId", async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [artworks, total] = await Promise.all([
      Artwork.find({ artist: req.params.artistId })
        .sort("-createdAt")
        .skip(skip)
        .limit(Number(limit)),
      Artwork.countDocuments({ artist: req.params.artistId }),
    ]);

    res.status(200).json({
      data: artworks,
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
