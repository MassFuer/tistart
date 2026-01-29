const router = require("express").Router();
const Artwork = require("../models/Artwork.model");
const VideoPurchase = require("../models/VideoPurchase.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { attachUser, isAdminRole } = require("../middleware/role.middleware");
const { getSignedVideoUrl, getKeyFromUrl } = require("../utils/r2");
const { purchaseLimiter } = require("../middleware/rateLimit.middleware");

// GET /api/videos/:artworkId/access - Check if user has access to video
router.get("/:artworkId/access", isAuthenticated, attachUser, async (req, res, next) => {
  try {
    const { artworkId } = req.params;

    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({ error: "Artwork not found" });
    }

    if (!artwork.video?.fullVideoUrl && !artwork.video?.url) {
      return res.status(404).json({ error: "This artwork has no video" });
    }

    // Free video - everyone has access
    if (!artwork.video.isPaid) {
      return res.json({
        data: {
          hasAccess: true,
          isFree: true,
        },
      });
    }

    // Check if user is the artist (owner always has access)
    if (artwork.artist.toString() === req.user._id.toString()) {
      return res.json({
        data: {
          hasAccess: true,
          isOwner: true,
        },
      });
    }

    // Check if user has purchased this video
    const purchase = await VideoPurchase.findOne({
      user: req.user._id,
      artwork: artworkId,
    });

    res.json({
      data: {
        hasAccess: !!purchase,
        purchasedAt: purchase?.createdAt || null,
        price: artwork.price,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/videos/:artworkId/stream - Get signed URL for video streaming
router.get("/:artworkId/stream", isAuthenticated, attachUser, async (req, res, next) => {
  try {
    const { artworkId } = req.params;

    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({ error: "Artwork not found" });
    }

    // Check if video exists
    const videoUrl = artwork.video?.fullVideoUrl || artwork.video?.url;

    if (!videoUrl) {
      return res.status(404).json({ error: "This artwork has no video" });
    }

    // Free video - generate signed URL directly
    if (!artwork.video.isPaid) {
      const key = getKeyFromUrl(videoUrl);
      const signedUrl = await getSignedVideoUrl(key);
      return res.json({
        data: {
          streamUrl: signedUrl,
          expiresIn: 4 * 60 * 60, // 4 hours in seconds
        },
      });
    }

    // Check if user is the artist
    const isOwner = artwork.artist.toString() === req.user._id.toString();
    // Check if user is admin
    const isAdmin = isAdminRole(req.user.role);

    // Check if user has purchased
    const purchase = await VideoPurchase.findOne({
      user: req.user._id,
      artwork: artworkId,
    });

    if (!isOwner && !isAdmin && !purchase) {
      return res.status(403).json({
        error: "You need to purchase this video to watch it",
        price: artwork.price,
      });
    }

    // Generate signed URL for authorized user
    const key = getKeyFromUrl(videoUrl);
    const signedUrl = await getSignedVideoUrl(key);

    res.json({
      data: {
        streamUrl: signedUrl,
        expiresIn: 4 * 60 * 60,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/videos/:artworkId/purchase - Instant purchase video access
router.post(
  "/:artworkId/purchase",
  isAuthenticated,
  purchaseLimiter,
  attachUser,
  async (req, res, next) => {
    try {
      const { artworkId } = req.params;

      const artwork = await Artwork.findById(artworkId).populate(
        "artist",
        "firstName lastName userName"
      );
      if (!artwork) {
        return res.status(404).json({ error: "Artwork not found" });
      }

      const videoUrl = artwork.video?.fullVideoUrl || artwork.video?.url;

      if (!videoUrl) {
        return res.status(400).json({ error: "This artwork has no video" });
      }

      if (!artwork.video.isPaid) {
        return res.status(400).json({ error: "This video is free, no purchase needed" });
      }

      // Check if already purchased
      const existingPurchase = await VideoPurchase.findOne({
        user: req.user._id,
        artwork: artworkId,
      });

      if (existingPurchase) {
        return res.status(400).json({ error: "You already own this video" });
      }

      // Check if user is trying to buy their own video
      if (artwork.artist._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ error: "You cannot purchase your own video" });
      }

      // TODO: Integrate with Stripe for real payment
      // For now, simulate payment success with a mock payment ID
      const mockPaymentId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create purchase record
      const purchase = await VideoPurchase.create({
        user: req.user._id,
        artwork: artworkId,
        pricePaid: artwork.price,
        paymentId: mockPaymentId,
        purchaseType: "instant",
      });

      // Generate signed URL for immediate access
      const key = getKeyFromUrl(videoUrl);
      const signedUrl = await getSignedVideoUrl(key);

      res.status(201).json({
        data: {
          purchase: {
            id: purchase._id,
            pricePaid: purchase.pricePaid,
            purchasedAt: purchase.createdAt,
          },
          streamUrl: signedUrl,
          expiresIn: 4 * 60 * 60,
          artwork: {
            id: artwork._id,
            title: artwork.title,
            artist: artwork.artist,
          },
        },
      });
    } catch (error) {
      // Handle duplicate purchase attempt (race condition)
      if (error.code === 11000) {
        return res.status(400).json({ error: "You already own this video" });
      }
      next(error);
    }
  }
);

// GET /api/videos/purchased - Get user's purchased videos
router.get("/purchased", isAuthenticated, attachUser, async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;

    const purchases = await VideoPurchase.find({ user: req.user._id })
      .populate({
        path: "artwork",
        select: "title video price artist category",
        populate: { path: "artist", select: "firstName lastName userName" },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await VideoPurchase.countDocuments({ user: req.user._id });

    res.json({
      data: purchases,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
