const express = require("express");
const router = express.Router();

const Artwork = require("../models/Artwork.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { isVerifiedArtist, isAdminRole } = require("../middleware/role.middleware");
const {
  uploadArtwork,
  processAndUploadArtwork,
  streamAndUploadVideo,
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
const { queryArtworks, getArtistStats } = require("../services/artwork.service");
const AppError = require("../utils/AppError");

// GET /api/artworks - Get all artworks (public)
router.get("/", async (req, res, next) => {
  try {
    const result = await queryArtworks(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/artworks/artist/stats - Get artist artworks with sales stats (verified artist)
router.get("/artist/stats", isAuthenticated, isVerifiedArtist, async (req, res, next) => {
  try {
    const artistId = req.user._id;
    const stats = await getArtistStats(artistId);
    res.status(200).json(stats);
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
      return next(new AppError("Artwork not found.", 404));
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

      // Determine artist ID
      let artistId = req.payload._id;
      if (isAdminRole(req.payload.role) && req.body.artist) {
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
        video: req.body.video || {},
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
      return next(new AppError("Artwork not found.", 404));
    }

    if (!isAdminRole(req.payload.role) && artwork.artist.toString() !== req.payload._id.toString()) {
      return next(new AppError("You can only update your own artworks.", 403));
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

    // Video metadata
    const videoFields = ["synopsis", "director", "coAuthor", "cast", "productionTeam", "isPaid"];
    if (req.body.video) {
        for (const vField of videoFields) {
            if (req.body.video[vField] !== undefined) {
                updateObj[`video.${vField}`] = req.body.video[vField];
            }
        }
    }

    // Handle image deletions
    if (req.body.images !== undefined) {
      const oldImages = artwork.images || [];
      const newImages = req.body.images || [];
      const removedImages = oldImages.filter((img) => !newImages.includes(img));

      const artistId = artwork.artist.toString();
      const BATCH_SIZE = 5;
      for (let i = 0; i < removedImages.length; i += BATCH_SIZE) {
        const chunk = removedImages.slice(i, i + BATCH_SIZE);
        await Promise.all(chunk.map((imageUrl) => deleteFile(imageUrl, artistId)));
      }
    }

    if (req.body.videoIsPaid !== undefined && artwork.video?.url) {
      updateObj["video.isPaid"] = req.body.videoIsPaid;
    }

    if (req.body.removeVideo === true && artwork.video?.url) {
      const artistId = artwork.artist.toString();
      await deleteFile(artwork.video.url, artistId);
      if (artwork.video.thumbnailUrl) {
        await deleteFile(artwork.video.thumbnailUrl, artistId);
      }
      if (artwork.video.previewUrl) {
        await deleteFile(artwork.video.previewUrl, artistId);
      }
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
      return next(new AppError("Artwork not found.", 404));
    }

    if (!isAdminRole(req.payload.role) && artwork.artist.toString() !== req.payload._id.toString()) {
      return next(new AppError("You can only delete your own artworks.", 403));
    }

    const artistId = artwork.artist.toString();
    const BATCH_SIZE = 5;
    for (let i = 0; i < artwork.images.length; i += BATCH_SIZE) {
      const chunk = artwork.images.slice(i, i + BATCH_SIZE);
      await Promise.all(chunk.map((imageUrl) => deleteFile(imageUrl, artistId)));
    }

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
        return next(new AppError("Artwork not found.", 404));
      }

      if (!isAdminRole(req.payload.role) && artwork.artist.toString() !== req.payload._id.toString()) {
        return next(new AppError("You can only upload images to your own artworks.", 403));
      }

      if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
        return next(new AppError("No images provided.", 400));
      }

      const imageUrls = req.uploadedFiles.map((file) => file.url);
      artwork.images.push(...imageUrls);
      await artwork.save();

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
  streamAndUploadVideo,
  async (req, res, next) => {
    try {
      const artwork = await Artwork.findById(req.params.id);

      if (!artwork) {
        return next(new AppError("Artwork not found.", 404));
      }

      if (!isAdminRole(req.payload.role) && artwork.artist.toString() !== req.payload._id.toString()) {
        return next(new AppError("You can only upload videos to your own artworks.", 403));
      }

      if (!req.uploadedVideo) {
        return next(new AppError("No video provided.", 400));
      }

      const fieldMap = {
          "video": "fullVideoUrl",
          "fullVideo": "fullVideoUrl",
          "previewVideo": "previewVideoUrl",
          "backgroundAudio": "backgroundAudioUrl",
          "subtitles": "subtitlesUrl"
      };

      const targetField = fieldMap[req.uploadedVideo.fieldName] || "fullVideoUrl";
      
      const updatePayload = {
          [`video.${targetField}`]: req.uploadedVideo.url
      };

      if (targetField === "fullVideoUrl") {
          if (req.body.isPaid !== undefined) updatePayload["video.isPaid"] = req.body.isPaid === "true" || req.body.isPaid === true;
          updatePayload["video.fileSize"] = req.uploadedVideo.size;
          if (req.body.duration) updatePayload["video.duration"] = Number(req.body.duration);
          updatePayload["video.url"] = req.uploadedVideo.url; 
      }

      const updatedArtwork = await Artwork.findByIdAndUpdate(
          req.params.id, 
          { $set: updatePayload }, 
          { new: true }
      );

      res.status(200).json({ data: updatedArtwork });
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
        return next(new AppError("Artwork not found.", 404));
      }

      if (!isAdminRole(req.payload.role) && artwork.artist.toString() !== req.payload._id.toString()) {
        return next(new AppError("You can only update your own artworks.", 403));
      }

      if (!req.file) {
        return next(new AppError("No thumbnail provided.", 400));
      }

      if (artwork.video?.thumbnailUrl) {
        await deleteFile(artwork.video.thumbnailUrl, artwork.artist.toString());
      }

      const processed = await processImage(req.file.buffer, IMAGE_TRANSFORMS.thumbnail);
      const folder = `videos/${artwork.artist}/thumbnails`;
      const key = generateFilename("thumbnail.webp", folder);
      const url = await uploadToR2(processed.buffer, key, "image/webp");

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
        .limit(Number(limit)).lean(),
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

// POST /api/artworks/:id/view - Increment view count
router.post("/:id/view", async (req, res, next) => {
    try {
        const { id } = req.params;
        await Artwork.findByIdAndUpdate(id, { $inc: { views: 1 } });
        res.status(200).json({ message: "View counted" });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
