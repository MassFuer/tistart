const express = require("express");
const router = express.Router();

const PlatformSettings = require("../models/PlatformSettings.model");
const PlatformStats = require("../models/PlatformStats.model");
const User = require("../models/User.model");
const Artwork = require("../models/Artwork.model");
const Event = require("../models/Event.model");
const Order = require("../models/Order.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { isSuperAdmin, isAdmin } = require("../middleware/role.middleware");
const Busboy = require("busboy");
const { Upload } = require("@aws-sdk/lib-storage");
const { 
  r2Client, 
  BUCKET_NAME, 
  PUBLIC_URL, 
  generateFilename, 
  getFileInfo 
} = require("../utils/r2");

// ==================== PLATFORM SETTINGS (SuperAdmin Only) ====================

// GET /api/platform/settings - Get platform settings
router.get("/settings", isAuthenticated, isSuperAdmin, async (req, res, next) => {
  try {
    const settings = await PlatformSettings.getSettings();
    res.status(200).json({ data: settings });
  } catch (error) {
    next(error);
  }
});

// GET /api/platform/config - Get public platform config (Theme, etc.)
router.get("/config", async (req, res, next) => {
  try {
    const settings = await PlatformSettings.getSettings();
    // Return only public fields
    const publicConfig = {
      theme: settings.theme,
      maintenance: {
          enabled: settings.maintenance.enabled,
          message: settings.maintenance.message
      },
      features: settings.features,
      geolocation: settings.geolocation,
      hero: settings.hero,
      display: settings.display
    };
    res.status(200).json({ data: publicConfig });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/platform/settings - Update platform settings
router.patch("/settings", isAuthenticated, isSuperAdmin, async (req, res, next) => {
  try {
    const allowedFields = [
      "platformCommission",
      "storage",
      "subscriptionTiers",
      "features",
      "rateLimits",
      "email",
      "geolocation",
      "maintenance",
      "theme",
      "hero",
      "display",
    ];

    const updateObj = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateObj[field] = req.body[field];
      }
    }

    if (Object.keys(updateObj).length === 0) {
      return res.status(400).json({ error: "No valid fields to update." });
    }

    const settings = await PlatformSettings.updateSettings(updateObj, req.user._id);
    res.status(200).json({ data: settings });
  } catch (error) {
    next(error);
  }
});

// POST /api/platform/assets - Upload platform assets (SuperAdmin Only)
router.post("/assets", isAuthenticated, isSuperAdmin, async (req, res, next) => {
  try {
    const bb = Busboy({ headers: req.headers });
    let uploadPromise = null;
    let fileFound = false;

    bb.on("file", (name, file, info) => {
      const { filename, mimeType } = info;
      fileFound = true;

      // Generate Key
      const folder = "platform/hero";
      const key = generateFilename(filename, folder);

      // Start Streaming Upload to R2
      const parallelUploads3 = new Upload({
        client: r2Client,
        params: {
          Bucket: BUCKET_NAME,
          Key: key,
          Body: file,
          ContentType: mimeType,
        },
      });

      uploadPromise = parallelUploads3.done().then(() => {
        const publicUrl = `${PUBLIC_URL}/${key}`;
        return {
          url: publicUrl,
          key: key,
          mimeType: mimeType
        };
      });
    });

    bb.on("close", async () => {
      if (!fileFound) {
        return res.status(400).json({ error: "No file provided." });
      }

      try {
        const uploadedAsset = await uploadPromise;
        
        // Get size
        const fileInfo = await getFileInfo(uploadedAsset.key);
        if (fileInfo) {
            uploadedAsset.size = fileInfo.size;
        }

        res.status(200).json({ data: uploadedAsset });
      } catch (err) {
        console.error("Platform asset upload failed:", err);
        next(err);
      }
    });

    req.pipe(bb);
  } catch (error) {
    next(error);
  }
});

// GET /api/platform/assets - List platform assets (SuperAdmin Only)
router.get("/assets", isAuthenticated, isSuperAdmin, async (req, res, next) => {
  try {
    const { folder = "platform/hero" } = req.query; // Default to hero folder
    // Security check: only allow listing platform subfolders
    if (!folder.startsWith("platform/")) {
       return res.status(403).json({ error: "Access denied. Can only list platform assets." });
    }

    const { listFolderContent } = require("../utils/r2");
    const assets = await listFolderContent(folder);
    res.status(200).json({ data: assets });
  } catch (error) {
    next(error);
  }
}); 

// ==================== PLATFORM STATISTICS (Admin & SuperAdmin) ====================

// GET /api/platform/stats - Get platform statistics
router.get("/stats", isAuthenticated, isAdmin, async (req, res, next) => {
  try {
    const { period = "all" } = req.query;

    // Build date filter based on period
    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case "today":
        dateFilter = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
        break;
      case "week":
        dateFilter = { $gte: new Date(now.setDate(now.getDate() - 7)) };
        break;
      case "month":
        dateFilter = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
        break;
      case "year":
        dateFilter = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
        break;
      default:
        dateFilter = null;
    }

    // Fetch cached stats for 'all' period
    let cachedStats = null;
    if (period === "all") {
      let stats = await PlatformStats.getStats();

      // Lazy Initialization if not yet synced
      if (!stats.initialized) {
        try {
          const [
            usersTotal,
            usersArtists,
            artworksTotal,
            artworksForSale,
            eventsTotal,
            orderStats,
          ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: "artist" }),
            Artwork.countDocuments(),
            Artwork.countDocuments({ isForSale: true }),
            Event.countDocuments(),
            Order.aggregate([
              { $match: { status: { $in: ["paid", "shipped", "delivered"] } } },
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  revenue: { $sum: "$totalAmount" },
                  fees: { $sum: "$platformFeeTotal" },
                },
              },
            ]),
          ]);

          stats.users.total = usersTotal;
          stats.users.artists = usersArtists;
          stats.artworks.total = artworksTotal;
          stats.artworks.forSale = artworksForSale;
          stats.events.total = eventsTotal;

          if (orderStats.length > 0) {
            stats.orders.total = orderStats[0].total;
            stats.orders.totalRevenue = orderStats[0].revenue;
            stats.orders.totalPlatformFees = orderStats[0].fees;
          }

          stats.initialized = true;
          await stats.save();
        } catch (err) {
          console.error("Failed to lazy initialize PlatformStats:", err);
          // Continue without cache
        }
      }

      if (stats.initialized) {
        cachedStats = stats;
      }
    }

    // Aggregation pipelines
    const userStats = await User.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          byRole: [{ $group: { _id: "$role", count: { $sum: 1 } } }],
          byArtistStatus: [
            { $match: { role: "artist" } },
            { $group: { _id: "$artistStatus", count: { $sum: 1 } } },
          ],
          recentSignups: dateFilter
            ? [{ $match: { createdAt: dateFilter } }, { $count: "count" }]
            : [{ $count: "count" }],
        },
      },
    ]);

    const artworkStats = await Artwork.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          forSale: [{ $match: { isForSale: true } }, { $count: "count" }],
          byCategory: [{ $group: { _id: "$category", count: { $sum: 1 } } }],
          totalValue: [
            { $match: { isForSale: true } },
            { $group: { _id: null, total: { $sum: "$price" } } },
          ],
        },
      },
    ]);

    const eventStats = await Event.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          upcoming: [{ $match: { startDateTime: { $gte: new Date() } } }, { $count: "count" }],
          byCategory: [{ $group: { _id: "$category", count: { $sum: 1 } } }],
          totalAttendees: [
            { $project: { attendeeCount: { $size: { $ifNull: ["$attendees", []] } } } },
            { $group: { _id: null, total: { $sum: "$attendeeCount" } } },
          ],
        },
      },
    ]);

    const orderStats = await Order.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          totalRevenue: [
            { $match: { status: { $in: ["paid", "shipped", "delivered"] } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ],
          recentOrders: dateFilter
            ? [{ $match: { createdAt: dateFilter } }, { $count: "count" }]
            : [{ $count: "count" }],
        },
      },
    ]);

    // Top artists by sales
    const topArtists = await Order.aggregate([
      { $match: { status: { $in: ["paid", "shipped", "delivered"] } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "artworks",
          localField: "items.artwork",
          foreignField: "_id",
          as: "artworkData",
        },
      },
      { $unwind: "$artworkData" },
      {
        $group: {
          _id: "$artworkData.artist",
          totalSales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "artist",
        },
      },
      { $unwind: "$artist" },
      {
        $project: {
          artistId: "$_id",
          artistName: { $concat: ["$artist.firstName", " ", "$artist.lastName"] },
          companyName: "$artist.artistInfo.companyName",
          totalSales: 1,
          orderCount: 1,
        },
      },
    ]);

    // Storage usage stats
    const storageStats = await User.aggregate([
      { $match: { role: { $in: ["artist", "admin", "superAdmin"] } } },
      {
        $group: {
          _id: null,
          totalStorageUsed: { $sum: "$storage.totalBytes" },
          totalImageBytes: { $sum: "$storage.imageBytes" },
          totalVideoBytes: { $sum: "$storage.videoBytes" },
          totalFiles: { $sum: "$storage.fileCount" },
          artistCount: { $sum: 1 },
        },
      },
    ]);

    // Platform commission earnings
    const commissionStats = await Order.aggregate([
      { $match: { status: { $in: ["paid", "shipped", "delivered"] } } },
      {
        $group: {
          _id: null,
          totalPlatformFees: { $sum: "$platformFeeTotal" },
          totalArtistEarnings: { $sum: { $subtract: ["$totalAmount", "$platformFeeTotal"] } },
          totalRevenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    // Revenue by time period (last 12 months)
    const revenueByMonth = await Order.aggregate([
      { $match: { status: { $in: ["paid", "shipped", "delivered"] } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          platformFees: { $sum: "$platformFeeTotal" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    // Top selling artworks
    const topArtworks = await Order.aggregate([
      { $match: { status: { $in: ["paid", "shipped", "delivered"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.artwork",
          totalSales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          unitsSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "artworks",
          localField: "_id",
          foreignField: "_id",
          as: "artwork",
        },
      },
      { $unwind: "$artwork" },
      {
        $lookup: {
          from: "users",
          localField: "artwork.artist",
          foreignField: "_id",
          as: "artist",
        },
      },
      { $unwind: "$artist" },
      {
        $project: {
          artworkId: "$_id",
          title: "$artwork.title",
          category: "$artwork.category",
          price: "$artwork.price",
          artistName: { $concat: ["$artist.firstName", " ", "$artist.lastName"] },
          totalSales: 1,
          unitsSold: 1,
        },
      },
    ]);

    // Top Viewed Videos
    const topViewedVideos = await Artwork.aggregate([
      { $match: { category: "video", views: { $gt: 0 } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
      {
         $lookup: {
            from: "users",
            localField: "artist",
            foreignField: "_id",
            as: "artistData"
         }
      },
      { $unwind: "$artistData" },
      {
         $project: {
             _id: 1,
             title: 1,
             views: 1,
             duration: "$video.duration",
             artistName: { $concat: ["$artistData.firstName", " ", "$artistData.lastName"] },
             companyName: "$artistData.artistInfo.companyName"
         }
      }
    ]);

    // Top Viewed Artworks (Non-Video)
    const topViewedOther = await Artwork.aggregate([
      { $match: { category: { $ne: "video" }, views: { $gt: 0 } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
      {
         $lookup: {
            from: "users",
            localField: "artist",
            foreignField: "_id",
            as: "artistData"
         }
      },
      { $unwind: "$artistData" },
       {
         $project: {
             _id: 1,
             title: 1,
             views: 1,
             category: 1,
             artistName: { $concat: ["$artistData.firstName", " ", "$artistData.lastName"] }
         }
      }
    ]);

    res.status(200).json({
      data: {
        users: {
          total: cachedStats ? cachedStats.users.total : userStats[0].total[0]?.count || 0,
          byRole: userStats[0].byRole,
          byArtistStatus: userStats[0].byArtistStatus,
          recentSignups: userStats[0].recentSignups[0]?.count || 0,
        },
        artworks: {
          total: cachedStats ? cachedStats.artworks.total : artworkStats[0].total[0]?.count || 0,
          forSale: cachedStats
            ? cachedStats.artworks.forSale
            : artworkStats[0].forSale[0]?.count || 0,
          byCategory: artworkStats[0].byCategory,
          totalValue: artworkStats[0].totalValue[0]?.total || 0,
        },
        events: {
          total: cachedStats ? cachedStats.events.total : eventStats[0].total[0]?.count || 0,
          upcoming: eventStats[0].upcoming[0]?.count || 0,
          byCategory: eventStats[0].byCategory,
          totalAttendees: eventStats[0].totalAttendees[0]?.total || 0,
        },
        orders: {
          total: cachedStats ? cachedStats.orders.total : orderStats[0].total[0]?.count || 0,
          byStatus: orderStats[0].byStatus,
          totalRevenue: cachedStats
            ? cachedStats.orders.totalRevenue
            : orderStats[0].totalRevenue[0]?.total || 0,
          recentOrders: orderStats[0].recentOrders[0]?.count || 0,
        },
        commission:
          cachedStats && period === "all"
            ? {
                totalPlatformFees: cachedStats.orders.totalPlatformFees,
                totalArtistEarnings:
                  cachedStats.orders.totalRevenue - cachedStats.orders.totalPlatformFees,
                totalRevenue: cachedStats.orders.totalRevenue,
                orderCount: cachedStats.orders.total,
              }
            : commissionStats[0] || {
                totalPlatformFees: 0,
                totalArtistEarnings: 0,
                totalRevenue: 0,
                orderCount: 0,
              },
        revenueByMonth,
        topArtists,
        topArtworks,
        topViewedVideos,
        topViewedOther,
        storage: storageStats[0] || {
          totalStorageUsed: 0,
          totalImageBytes: 0,
          totalVideoBytes: 0,
          totalFiles: 0,
          artistCount: 0,
        },
        period,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ==================== USER STORAGE MANAGEMENT (SuperAdmin Only) ====================

// GET /api/platform/storage - Get storage usage for all artists
router.get("/storage", isAuthenticated, isSuperAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = "storage.totalBytes", order = "desc" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const sortDir = order === "asc" ? 1 : -1;

    let sortObj = {};
    if (sort) {
        sortObj[sort] = sortDir;
    } else {
        sortObj["storage.totalBytes"] = -1;
    }
    
    // Ensure stable sort
    sortObj["_id"] = 1;

    const aggregationPipeline = [
      { $match: { role: { $in: ["artist", "admin", "superAdmin"] } } },
      {
        $lookup: {
          from: "artworks",
          let: { artistId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$artist", "$$artistId"] } } },
            { $group: { 
                _id: "$category", 
                count: { $sum: 1 } 
              } 
            }
          ],
          as: "artworkCounts"
        }
      },
      {
        $addFields: {
           videoCount: {
               $let: {
                   vars: { videoObj: { $arrayElemAt: [{ $filter: { input: "$artworkCounts", as: "c", cond: { $eq: ["$$c._id", "video"] } } }, 0] } },
                   in: { $ifNull: ["$$videoObj.count", 0] }
               }
           },
           imageCount: {
                $reduce: {
                    input: { 
                        $filter: { 
                            input: "$artworkCounts", 
                            as: "c", 
                            cond: { $ne: ["$$c._id", "video"] } 
                        } 
                    },
                    initialValue: 0,
                    in: { $add: ["$$value", "$$this.count"] }
                }
           }
        }
      },
      { $project: {
          firstName: 1, 
          lastName: 1, 
          userName: 1, 
          email: 1, 
          "artistInfo.companyName": 1, 
          storage: 1, 
          role: 1,
          subscriptionTier: 1,
          profilePicture: 1,
          videoCount: 1,
          imageCount: 1,
          updatedAt: 1
      }},
      { $sort: sortObj },
      { $skip: skip },
      { $limit: Number(limit) }
    ];

    const [artists, total] = await Promise.all([
      User.aggregate(aggregationPipeline),
      User.countDocuments({ role: { $in: ["artist", "admin", "superAdmin"] } }),
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

// PATCH /api/platform/storage/:userId - Update user storage quota
router.patch("/storage/:userId", isAuthenticated, isSuperAdmin, async (req, res, next) => {
  try {
    const { quotaBytes, subscriptionTier } = req.body;

    const updateObj = {};
    if (quotaBytes !== undefined) {
      updateObj["storage.quotaBytes"] = quotaBytes;
    }
    if (subscriptionTier) {
      const validTiers = ["free", "pro", "enterprise"];
      if (!validTiers.includes(subscriptionTier)) {
        return res.status(400).json({
          error: `Invalid subscription tier. Must be one of: ${validTiers.join(", ")}`,
        });
      }
      updateObj.subscriptionTier = subscriptionTier;

      // Auto-update quota based on tier
      const settings = await PlatformSettings.getSettings();
      const tier = settings.subscriptionTiers.find(
        (t) => t.name.toLowerCase() === subscriptionTier
      );
      if (tier) {
        updateObj["storage.quotaBytes"] = tier.storageQuotaBytes;
      }
    }

    if (Object.keys(updateObj).length === 0) {
      return res.status(400).json({ error: "No valid fields to update." });
    }

    const user = await User.findByIdAndUpdate(req.params.userId, updateObj, {
      new: true,
    }).select("firstName lastName userName storage subscriptionTier");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
});

// GET /api/platform/storage/:userId/files - List all files for a user (SuperAdmin Only)
router.get("/storage/:userId/files", isAuthenticated, isSuperAdmin, async (req, res, next) => {
  try {
     const { userId } = req.params;
     const { listFolderContent } = require("../utils/r2");
     
     // Folders to check
     const folders = [
         `artworks/${userId}`,
         `videos/${userId}`,
         `events/${userId}`,
         `profiles/${userId}`,
         `logos/${userId}`
     ];
     
     // Fetch all parallely
     const results = await Promise.all(folders.map(folder => listFolderContent(folder)));
     
     // Flatten and categorize
     const files = results.flat().map(file => {
          // Add type based on key
          let type = "other";
          if (file.key.startsWith(`artworks/${userId}`)) type = "artwork";
          else if (file.key.startsWith(`videos/${userId}`)) type = "video";
          else if (file.key.startsWith(`events/${userId}`)) type = "event";
          else if (file.key.startsWith(`profiles/${userId}`)) type = "profile";
          else if (file.key.startsWith(`logos/${userId}`)) type = "logo";
          
          return { ...file, type };
     });
     
     res.status(200).json({ data: files });
  } catch (error) {
     next(error);
  }
});

// ==================== MAINTENANCE MODE (SuperAdmin Only) ====================

// POST /api/platform/maintenance - Toggle maintenance mode
router.post("/maintenance", isAuthenticated, isSuperAdmin, async (req, res, next) => {
  try {
    const { enabled, message, allowedIPs } = req.body;

    const updateObj = {
      "maintenance.enabled": enabled !== undefined ? enabled : false,
    };

    if (message) {
      updateObj["maintenance.message"] = message;
    }

    if (allowedIPs) {
      updateObj["maintenance.allowedIPs"] = allowedIPs;
    }

    const settings = await PlatformSettings.updateSettings(updateObj, req.user._id);

    res.status(200).json({
      message: settings.maintenance.enabled
        ? "Maintenance mode enabled"
        : "Maintenance mode disabled",
      data: settings.maintenance,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
