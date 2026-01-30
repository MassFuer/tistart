const VideoPurchase = require("../models/VideoPurchase.model");
const { isAdminRole } = require("../middleware/role.middleware");

/**
 * Checks if a user has access to the full video of an artwork.
 */
const checkVideoAccess = async (artwork, user) => {
  if (!artwork.video?.isPaid) return true;
  if (!user) return false;

  const userId = user._id.toString();
  const artistId = artwork.artist._id ? artwork.artist._id.toString() : artwork.artist.toString();

  // Artist/Owner has access
  if (userId === artistId) return true;

  // Admin has access
  if (isAdminRole(user.role)) return true;

  // Check if purchased
  const purchase = await VideoPurchase.findOne({
    user: userId,
    artwork: artwork._id,
  });

  return !!purchase;
};

/**
 * Redacts fullVideoUrl from an artwork if the user doesn't have access.
 */
const sanitizeArtwork = async (artwork, user) => {
  if (!artwork || !artwork.video) return artwork;

  const hasAccess = await checkVideoAccess(artwork, user);

  if (!hasAccess) {
    // Clone to avoid modifying the original if it's from a cache/lean query
    const sanitized = { ...artwork, video: { ...artwork.video } };
    delete sanitized.video.fullVideoUrl;
    delete sanitized.video.url; // Legacy field
    return sanitized;
  }

  return artwork;
};

module.exports = { checkVideoAccess, sanitizeArtwork };
