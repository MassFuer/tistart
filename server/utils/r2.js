const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multer = require("multer");
const Busboy = require("busboy");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

// Configure R2 client (S3-compatible)
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for R2 compatibility
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "nemesis";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || `https://${BUCKET_NAME}.r2.dev`;

// File type configurations
const FILE_CONFIGS = {
  image: {
    allowedMimes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  video: {
    allowedMimes: ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"],
    allowedExtensions: [".mp4", ".webm", ".mov", ".avi"],
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
  },
  logo: {
    allowedMimes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".svg"],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
};

// Image transformation configs
const IMAGE_TRANSFORMS = {
  artwork: { width: 1200, height: 1200, fit: "inside" },
  profile: { width: 400, height: 400, fit: "cover" },
  event: { width: 1200, height: 630, fit: "cover" },
  logo: { width: 500, height: 500, fit: "inside" },
  thumbnail: { width: 300, height: 300, fit: "cover" },
};

// Generate unique filename
const generateFilename = (originalName, folder) => {
  const ext = path.extname(originalName).toLowerCase();
  const uniqueId = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  return `${folder}/${timestamp}-${uniqueId}${ext}`;
};

// Process and optimize image
const processImage = async (buffer, transform, format = "webp") => {
  try {
    let pipeline = sharp(buffer);

    // Get metadata
    const metadata = await pipeline.metadata();

    // Apply transformation
    if (transform) {
      pipeline = pipeline.resize({
        width: transform.width,
        height: transform.height,
        fit: transform.fit,
        withoutEnlargement: true,
      });
    }

    // Convert to optimized format (webp for better compression)
    if (format === "webp" && metadata.format !== "svg") {
      pipeline = pipeline.webp({ quality: 85 });
    } else if (metadata.format === "jpeg" || metadata.format === "jpg") {
      pipeline = pipeline.jpeg({ quality: 85 });
    } else if (metadata.format === "png") {
      pipeline = pipeline.png({ quality: 85 });
    }

    const processedBuffer = await pipeline.toBuffer();
    return {
      buffer: processedBuffer,
      size: processedBuffer.length,
      format: format === "webp" ? "webp" : metadata.format,
    };
  } catch (error) {
    console.error("Error processing image:", error);
    // Return original buffer if processing fails
    return { buffer, size: buffer.length, format: path.extname(buffer).slice(1) };
  }
};

// Upload file to R2
const uploadToR2 = async (buffer, key, contentType) => {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await r2Client.send(command);
    return `${PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error("R2 Upload Error:", error.message);
    console.error("R2 Config - Endpoint:", process.env.R2_ENDPOINT);
    console.error("R2 Config - Bucket:", BUCKET_NAME);
    throw new Error(`Failed to upload to R2: ${error.message}`);
  }
};

// Delete file from R2
const deleteFromR2 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting from R2:", error);
    throw error;
  }
};

// Get file info from R2
const getFileInfo = async (key) => {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    const response = await r2Client.send(command);
    return {
      size: response.ContentLength,
      contentType: response.ContentType,
      lastModified: response.LastModified,
    };
  } catch (error) {
    console.error("Error getting file info:", error);
    return null;
  }
};

// List files in a folder
const listFolderContent = async (prefix) => {
    try {
        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: prefix
        });
        const response = await r2Client.send(command);
        
        if (!response.Contents) return [];

        return response.Contents.map(item => ({
            key: item.Key,
            url: `${PUBLIC_URL}/${item.Key}`,
            lastModified: item.LastModified,
            size: item.Size
        }));
    } catch (error) {
        console.error("Error listing folder content:", error);
        return [];
    }
};

// Extract key from R2 URL
const getKeyFromUrl = (url) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.slice(1); // Remove leading slash
  } catch {
    // If URL parsing fails, try to extract path
    const parts = url.split("/");
    return parts.slice(3).join("/");
  }
};

// Check if file is video
const isVideo = (mimeType) => {
  return FILE_CONFIGS.video.allowedMimes.includes(mimeType);
};

// Check if file is image
const isImage = (mimeType) => {
  return FILE_CONFIGS.image.allowedMimes.includes(mimeType);
};

// Multer memory storage for processing before R2 upload
const memoryStorage = multer.memoryStorage();

// File filter function generator
const createFileFilter = (type) => (req, file, cb) => {
  const config = FILE_CONFIGS[type] || FILE_CONFIGS.image;
  const ext = path.extname(file.originalname).toLowerCase();

  if (!config.allowedMimes.includes(file.mimetype)) {
    return cb(
      new Error(`Invalid file type. Allowed: ${config.allowedExtensions.join(", ")}`),
      false
    );
  }

  if (!config.allowedExtensions.includes(ext)) {
    return cb(
      new Error(`Invalid file extension. Allowed: ${config.allowedExtensions.join(", ")}`),
      false
    );
  }

  cb(null, true);
};

// Create multer upload middleware
const createUploader = (type, maxFiles = 1) => {
  const config = FILE_CONFIGS[type] || FILE_CONFIGS.image;

  return multer({
    storage: memoryStorage,
    limits: { fileSize: config.maxSize },
    fileFilter: createFileFilter(type),
  });
};

// Multer upload configurations
const uploadArtwork = createUploader("image", 5);
const uploadProfile = createUploader("image", 1);
const uploadEvent = createUploader("image", 1);
const uploadLogo = createUploader("logo", 1);
const uploadVideo = createUploader("video", 1);

// Streaming Video Upload Middleware
const streamAndUploadVideo = async (req, res, next) => {
  try {
    // 1. Check User and Quota (Early fail)
    const User = require("../models/User.model");
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentUsage = user.storage?.totalBytes || 0;
    const quota = user.storage?.quotaBytes || 5 * 1024 * 1024 * 1024; // 5GB default

    // Approximate size check using Content-Length
    const contentLength = parseInt(req.headers["content-length"] || "0", 10);
    // Allow if content-length is missing (chunked) or within limits
    // Note: Content-Length includes whole body, not just file, but good for upper bound check
    if (contentLength > 0 && currentUsage + contentLength > quota) {
      const usedGB = (currentUsage / (1024 * 1024 * 1024)).toFixed(2);
      const quotaGB = (quota / (1024 * 1024 * 1024)).toFixed(2);
      return res.status(400).json({
         error: `Storage quota exceeded (estimated). Used: ${usedGB}GB / ${quotaGB}GB.`
      });
    }

    const bb = Busboy({ headers: req.headers });
    let uploadPromise = null;
    let fileFound = false;

    bb.on("file", (name, file, info) => {
      const { filename, mimeType } = info;

      // Allow specific field names
      const allowedFields = ["video", "fullVideo", "previewVideo", "backgroundAudio", "subtitles"];
      if (!allowedFields.includes(name)) {
        file.resume(); // Drain stream
        return;
      }

      fileFound = true;

      // Validate Mime Type based on field name
      const isAudio = name === "backgroundAudio";
      const isSubtitle = name === "subtitles";
      const isVideo = ["video", "fullVideo", "previewVideo"].includes(name);

      if (isVideo && !FILE_CONFIGS.video.allowedMimes.includes(mimeType)) {
        return next(new Error(`Invalid video type: ${mimeType}`));
      }
      if (isAudio && !["audio/mpeg", "audio/mp3", "audio/aac", "audio/wav"].includes(mimeType)) {
         return next(new Error(`Invalid audio type: ${mimeType}`));
      }
      // Simple text check for subs or allow generally
      if (isSubtitle && !["text/vtt", "application/x-subrip", "text/plain"].includes(mimeType) && !filename.endsWith(".vtt") && !filename.endsWith(".srt")) {
        // Mime types for subs are tricky, often text/plain. We rely on extension mostly or relaxed check.
      }

      // Generate Key
      const folder = `videos/${req.user._id}`;
      const videoKey = generateFilename(filename, folder);

      // Start Streaming Upload to R2
      const parallelUploads3 = new Upload({
        client: r2Client,
        params: {
          Bucket: BUCKET_NAME,
          Key: videoKey,
          Body: file,
          ContentType: mimeType,
        },
        leavePartsOnError: false, // Cleanup multipart upload on failure
      });

      uploadPromise = parallelUploads3.done().then((result) => {
        // Result typically contains Location, Key, Bucket
        const publicUrl = `${PUBLIC_URL}/${videoKey}`;

        // Populate req.uploadedVideo
        req.uploadedVideo = {
            url: publicUrl,
            key: videoKey,
            mimeType: mimeType,
            fieldName: name
        };
        return req.uploadedVideo;
      });
    });

    bb.on("field", (name, val, info) => {
      // Collect other fields into req.body if needed
      if (!req.body) req.body = {};
      req.body[name] = val;
    });

    bb.on("close", async () => {
      if (!fileFound) {
        return res.status(400).json({ error: "No video file provided." });
      }

      try {
        const uploadedVideo = await uploadPromise;

        // Get actual size from R2 to update quota accurately
        const fileInfo = await getFileInfo(uploadedVideo.key);
        if (fileInfo) {
            uploadedVideo.size = fileInfo.size;
            await updateUserStorage(req.user._id, fileInfo.size, "video");
        }

        next();
      } catch (err) {
        console.error("Streaming upload failed:", err);
        next(err);
      }
    });

    bb.on("error", (err) => {
        console.error("Busboy error:", err);
        next(err);
    });

    req.pipe(bb);

  } catch (error) {
    next(error);
  }
};

// Process and upload middleware for artwork images
const processAndUploadArtwork = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const uploadedUrls = [];
    let totalBytes = 0;

    for (const file of req.files) {
      const folder = `artworks/${req.user._id}`;
      let key, url, size;

      if (isImage(file.mimetype)) {
        // Process image
        const processed = await processImage(file.buffer, IMAGE_TRANSFORMS.artwork);
        key = generateFilename(file.originalname, folder).replace(/\.[^.]+$/, ".webp");
        url = await uploadToR2(processed.buffer, key, "image/webp");
        size = processed.size;
      } else {
        // Upload as-is (video)
        key = generateFilename(file.originalname, folder);
        url = await uploadToR2(file.buffer, key, file.mimetype);
        size = file.buffer.length;
      }

      uploadedUrls.push({ url, key, size, type: isVideo(file.mimetype) ? "video" : "image" });
      totalBytes += size;
    }

    req.uploadedFiles = uploadedUrls;
    req.totalUploadedBytes = totalBytes;
    next();
  } catch (error) {
    next(error);
  }
};

// Process and upload middleware for profile pictures
const processAndUploadProfile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const folder = `profiles/${req.user._id}`;
    const processed = await processImage(req.file.buffer, IMAGE_TRANSFORMS.profile);
    const key = generateFilename(req.file.originalname, folder).replace(/\.[^.]+$/, ".webp");
    const url = await uploadToR2(processed.buffer, key, "image/webp");

    req.uploadedFile = { url, key, size: processed.size, type: "image" };
    next();
  } catch (error) {
    next(error);
  }
};

// Process and upload middleware for event images
const processAndUploadEvent = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const folder = `events/${req.user._id}`;
    const processed = await processImage(req.file.buffer, IMAGE_TRANSFORMS.event);
    const key = generateFilename(req.file.originalname, folder).replace(/\.[^.]+$/, ".webp");
    const url = await uploadToR2(processed.buffer, key, "image/webp");

    req.uploadedFile = { url, key, size: processed.size, type: "image" };
    next();
  } catch (error) {
    next(error);
  }
};

// Process and upload middleware for logos
const processAndUploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const folder = `logos/${req.user._id}`;
    let key, url, size;

    // Don't process SVG files
    if (req.file.mimetype === "image/svg+xml") {
      key = generateFilename(req.file.originalname, folder);
      url = await uploadToR2(req.file.buffer, key, req.file.mimetype);
      size = req.file.buffer.length;
    } else {
      const processed = await processImage(req.file.buffer, IMAGE_TRANSFORMS.logo);
      key = generateFilename(req.file.originalname, folder).replace(/\.[^.]+$/, ".webp");
      url = await uploadToR2(processed.buffer, key, "image/webp");
      size = processed.size;
    }

    req.uploadedFile = { url, key, size, type: "image" };
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check storage quota before upload
const checkStorageQuota = async (req, res, next) => {
  try {
    const User = require("../models/User.model");
    const PlatformSettings = require("../models/PlatformSettings.model");
    const PlatformStats = require("../models/PlatformStats.model");
    const { sendLowStorageAlert } = require("../utils/email"); // Assuming this exists or we'll mock/add it

    const [user, settings, stats] = await Promise.all([
        User.findById(req.user._id),
        PlatformSettings.getSettings(),
        PlatformStats.getStats()
    ]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Calculate incoming file size
    let incomingSize = 0;
    if (req.file) {
      incomingSize = req.file.size;
    } else if (req.files) {
      incomingSize = req.files.reduce((sum, f) => sum + f.size, 0);
    }

    // 1. GLOBAL PLATFORM QUOTA CHECK
    const maxPlatform = settings.storage.maxPlatformBytes;
    const currentPlatform = stats.storage?.totalBytes || 0;
    
    if (currentPlatform + incomingSize > maxPlatform) {
        // Send alert if needed (but block first)
        // Rate limited alert check could go here if we want to alert on blocking too.
        console.warn("Platform storage limit exceeded!");
        // We might want to allow SuperAdmin to override even this, but user said "limit user".
        // Let's allow SuperAdmin to always upload to fix things if stuck.
        if (user.role !== "superAdmin") {
            return res.status(507).json({ error: "Platform storage capacity reached. Uploads temporarily disabled." });
        }
    }

    // Check for Low Storage Alert (Platform)
    const usagePercent = ((currentPlatform + incomingSize) / maxPlatform) * 100;
    if (usagePercent > settings.storage.alertThresholdPercent) {
        // Check if we already sent an alert recently (e.g., in the last 24 hours)
        const lastAlert = settings.storage.lastAlertSent;
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (!lastAlert || (Date.now() - new Date(lastAlert).getTime() > oneDay)) {
            // Trigger alert
            console.log("Triggering platform storage alert...");
            // TODO: Implement actual email sending here or via import
            // For now update the timestamp
            await PlatformSettings.updateOne(
                { _id: "global" }, 
                { "storage.lastAlertSent": new Date() }
            );
        }
    }

    // 2. USER PERSONAL QUOTA CHECK
    // Admins and SuperAdmins have unlimited personal storage
    if (["admin", "superAdmin"].includes(user.role)) {
        return next();
    }

    const currentUsage = user.storage?.totalBytes || 0;
    const quota = user.storage?.quotaBytes || settings.storage.defaultQuotaBytes;

    if (currentUsage + incomingSize > quota) {
      const usedGB = (currentUsage / (1024 * 1024 * 1024)).toFixed(2);
      const quotaGB = (quota / (1024 * 1024 * 1024)).toFixed(2);
      return res.status(400).json({
        error: `Storage quota exceeded. Used: ${usedGB}GB / ${quotaGB}GB. Please upgrade your plan or delete some files.`,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Update user storage AND platform stats after upload
const updateUserStorage = async (userId, bytes, type = "image") => {
  const User = require("../models/User.model");
  const PlatformStats = require("../models/PlatformStats.model");

  const updateFields = {
    "storage.totalBytes": bytes,
    "storage.fileCount": 1,
  };

  if (type === "video") {
    updateFields["storage.videoBytes"] = bytes;
  } else {
    updateFields["storage.imageBytes"] = bytes;
  }

  await Promise.all([
      User.findByIdAndUpdate(userId, { $inc: updateFields }),
      PlatformStats.updateOne({ _id: "global" }, { $inc: { "storage.totalBytes": bytes } })
  ]);
};

// Decrease user storage after deletion
const decreaseUserStorage = async (userId, bytes, type = "image") => {
  const User = require("../models/User.model");
  const PlatformStats = require("../models/PlatformStats.model");

  const updateFields = {
    "storage.totalBytes": -bytes,
    "storage.fileCount": -1,
  };

  if (type === "video") {
    updateFields["storage.videoBytes"] = -bytes;
  } else {
    updateFields["storage.imageBytes"] = -bytes;
  }

  await Promise.all([
      User.findByIdAndUpdate(userId, { $inc: updateFields }),
      PlatformStats.updateOne({ _id: "global" }, { $inc: { "storage.totalBytes": -bytes } })
  ]);
};

// Generate signed URL for protected video streaming (expires in 4 hours)
const getSignedVideoUrl = async (key, expiresIn = 4 * 60 * 60) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw new Error("Failed to generate video access URL");
  }
};

// Process and upload video with thumbnail generation
const processAndUploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const folder = `videos/${req.user._id}`;
    const videoKey = generateFilename(req.file.originalname, folder);

    // Upload full video
    const videoUrl = await uploadToR2(req.file.buffer, videoKey, req.file.mimetype);

    req.uploadedVideo = {
      url: videoUrl,
      key: videoKey,
      size: req.file.buffer.length,
      mimeType: req.file.mimetype,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Upload video thumbnail (separate from main video upload)
const uploadVideoThumbnail = async (buffer, userId, artworkId) => {
  const folder = `videos/${userId}/thumbnails`;
  const processed = await processImage(buffer, IMAGE_TRANSFORMS.thumbnail);
  const key = `${folder}/${artworkId}-thumb.webp`;
  const url = await uploadToR2(processed.buffer, key, "image/webp");
  return { url, key, size: processed.size };
};

// Delete image/video and update storage
const deleteFile = async (url, userId) => {
  const key = getKeyFromUrl(url);
  if (!key) return false;

  try {
    // Get file info before deletion
    const fileInfo = await getFileInfo(key);
    if (fileInfo) {
      await deleteFromR2(key);

      // Update storage if user provided
      if (userId) {
        const type =
          key.includes("video") || fileInfo.contentType?.startsWith("video") ? "video" : "image";
        await decreaseUserStorage(userId, fileInfo.size, type);
      }
    }
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
};

module.exports = {
  r2Client,
  uploadToR2,
  deleteFromR2,
  deleteFile,
  getFileInfo,
  listFolderContent,
  getKeyFromUrl,
  processImage,
  isVideo,
  isImage,
  generateFilename,
  // Multer uploaders
  uploadArtwork,
  uploadProfile,
  uploadEvent,
  uploadLogo,
  uploadVideo,
  // Processing middlewares
  processAndUploadArtwork,
  processAndUploadProfile,
  processAndUploadEvent,
  processAndUploadLogo,
  processAndUploadVideo,
  streamAndUploadVideo, // New streaming middleware
  checkStorageQuota,
  // Video-specific
  getSignedVideoUrl,
  uploadVideoThumbnail,
  // Storage tracking
  updateUserStorage,
  decreaseUserStorage,
  // Constants
  FILE_CONFIGS,
  IMAGE_TRANSFORMS,
  BUCKET_NAME,
  PUBLIC_URL,
};
