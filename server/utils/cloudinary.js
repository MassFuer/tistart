const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage configuration for artwork images
const artworkStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "nemesis/artworks",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto" }],
  },
});

// Storage configuration for profile pictures
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "nemesis/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face", quality: "auto" }],
  },
});

// Storage configuration for event images
const eventStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "nemesis/events",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 630, crop: "fill", quality: "auto" }],
  },
});

// Storage configuration for artist logos
const logoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "nemesis/logos",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "svg"],
    transformation: [{ width: 500, height: 500, crop: "limit", quality: "auto" }],
  },
});

// File size limit (5MB)
const fileSizeLimit = 5 * 1024 * 1024;

// Multer upload configurations
const uploadArtwork = multer({
  storage: artworkStorage,
  limits: { fileSize: fileSizeLimit },
});

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: fileSizeLimit },
});

const uploadEvent = multer({
  storage: eventStorage,
  limits: { fileSize: fileSizeLimit },
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: fileSizeLimit },
});

// Helper to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
};

// Extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split("/");
  const filename = parts[parts.length - 1];
  const folder = parts[parts.length - 2];
  const publicId = `${folder}/${filename.split(".")[0]}`;
  return publicId;
};

module.exports = {
  cloudinary,
  uploadArtwork,
  uploadProfile,
  uploadEvent,
  uploadLogo,
  deleteImage,
  getPublicIdFromUrl,
};
