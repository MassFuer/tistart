const { Schema, model } = require("mongoose");
const { generateNGrams } = require("../utils/ngram");

const dimensionsSchema = new Schema(
  {
    width: { type: Number },
    height: { type: Number },
    depth: { type: Number },
    unit: {
      type: String,
      enum: ["cm", "in", "m"],
      default: "cm",
    },
  },
  { _id: false }
);

const artworkSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required."],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters."],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters."],
    },
    artist: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Artist is required."],
    },
    originalPrice: {
      type: Number,
      min: [0, "Price cannot be negative."],
    },
    price: {
      type: Number,
      required: [true, "Price is required."],
      min: [0, "Price cannot be negative."],
    },
    isForSale: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      required: [true, "Category is required."],
      enum: ["painting", "sculpture", "photography", "digital", "music", "video", "other"],
    },
    materialsUsed: [
      {
        type: String,
        trim: true,
      },
    ],
    colors: [
      {
        type: String,
        trim: true,
      },
    ],
    dimensions: {
      type: dimensionsSchema,
      default: () => ({}),
    },
    images: [
      {
        type: String, // R2/Cloudinary URLs
      },
    ],
    // Video-specific fields (for category: 'video' or 'music')
    video: {
      // Full video URL (private bucket for paid, public for free)
      url: { type: String },
      // Preview clip URL (always public, 30-60 sec)
      previewUrl: { type: String },
      // Thumbnail image URL (always public)
      thumbnailUrl: { type: String },
      // Duration in seconds
      duration: { type: Number },
      // Is this a paid video? (false = free to watch)
      isPaid: { type: Boolean, default: false },
      // File size in bytes (for display)
      fileSize: { type: Number },
    },
    totalInStock: {
      type: Number,
      default: 1,
      min: [0, "Stock cannot be negative."],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
    // Optimization for substring search
    searchKeywords: {
      type: [String],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to populate searchKeywords
artworkSchema.pre("save", function (next) {
  if (this.isModified("title") || this.isModified("description") || this.isNew) {
    const titleGrams = generateNGrams(this.title);
    const descGrams = generateNGrams(this.description);
    this.searchKeywords = [...new Set([...titleGrams, ...descGrams])];
  }
  next();
});

// Indexes for efficient queries
artworkSchema.index({ artist: 1 });
artworkSchema.index({ category: 1 });
artworkSchema.index({ price: 1 });
artworkSchema.index({ isForSale: 1 });
artworkSchema.index({ createdAt: -1 });

// Index for n-gram search optimization
artworkSchema.index({ searchKeywords: 1 });

// Text index for search (keeping it for legacy or alternative use)
artworkSchema.index({ title: "text", description: "text" });

const Artwork = model("Artwork", artworkSchema);

module.exports = Artwork;
