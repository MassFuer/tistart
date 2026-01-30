const Artwork = require("../models/Artwork.model");
const Order = require("../models/Order.model");

/**
 * Filter and query artworks
 */
const queryArtworks = async (query) => {
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
    director,
    cast,
    team,
    sort = "-createdAt",
    search,
  } = query;

  // Build filter object
  const filter = {};

  if (category) filter.category = category;

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (artist) filter.artist = artist;
  if (materials) filter.materialsUsed = materials;
  if (colors) filter.colors = colors;

  // Video Filters
  if (director) filter["video.director"] = director;
  if (cast) filter["video.cast"] = cast;
  if (team) filter["video.productionTeam.name"] = team;

  if (isForSale !== undefined) {
    filter.isForSale = isForSale === "true";
  }

  if (search) {
    const searchTokens = search.toLowerCase().trim().split(/[\s\-_.,;?!]+/);
    const validTokens = searchTokens.filter((t) => t.length > 0);

    if (validTokens.length > 0) {
      const hasSmallTokens = validTokens.some((t) => t.length < 3);

      if (hasSmallTokens) {
        const searchRegex = new RegExp(search, "i");
        filter.searchString = { $regex: searchRegex };
      } else {
        filter.searchKeywords = { $all: validTokens };
      }
    }
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Sorting
  let sortField = sort;
  let sortDirection = 1;

  if (sort.startsWith("-")) {
    sortDirection = -1;
    sortField = sort.substring(1);
  }

  const sortMapping = {
    revenue: "stats.totalRevenue",
    sales: "stats.totalSold",
    rating: "averageRating",
    price: "price",
    title: "title",
    createdAt: "createdAt",
    stock: "stock",
  };

  const dbSortField = sortMapping[sortField] || sortField;
  const sortObj = { [dbSortField]: sortDirection };

  // Execute
  const [artworks, total] = await Promise.all([
    Artwork.find(filter)
      .populate("artist", "firstName lastName userName artistInfo.companyName profilePicture")
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Artwork.countDocuments(filter),
  ]);

  return {
    data: artworks,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  };
};

/**
 * Get artist stats
 */
const getArtistStats = async (artistId) => {
  // 1. Aggregate Orders
  const orderStats = await Order.aggregate([
    {
      $match: {
        "items.artist": artistId,
        status: { $in: ["paid", "shipped", "delivered"] },
      },
    },
    { $unwind: "$items" },
    {
      $match: {
        "items.artist": artistId,
        "items.itemType": "artwork",
      },
    },
    {
      $group: {
        _id: "$items.artwork",
        totalSold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: "$items.artistEarnings" },
      },
    },
  ]);

  const statsMap = {};
  let totalArtistRevenue = 0;
  let totalItemsSold = 0;

  orderStats.forEach((stat) => {
    if (stat._id) {
      statsMap[stat._id.toString()] = {
        sold: stat.totalSold,
        revenue: stat.totalRevenue,
      };
      totalArtistRevenue += stat.totalRevenue;
      totalItemsSold += stat.totalSold;
    }
  });

  // 2. Fetch Artworks
  const artworks = await Artwork.find({ artist: artistId }).sort("-createdAt");

  // 3. Merge
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

  // 4. Calculate KPIs
  const totalArtworks = artworks.length;
  const totalReviews = artworks.reduce((acc, curr) => acc + (curr.numOfReviews || 0), 0);
  const totalRatingSum = artworks.reduce(
    (acc, curr) => acc + (curr.averageRating || 0) * (curr.numOfReviews || 0),
    0
  );
  const avgRating = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : 0;

  return {
    data: artworksWithStats,
    kpis: {
      totalRevenue: totalArtistRevenue,
      totalSold: totalItemsSold,
      totalArtworks,
      totalReviews,
      avgRating: Number(avgRating),
    },
  };
};

module.exports = {
  queryArtworks,
  getArtistStats,
};
