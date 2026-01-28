const { Schema, model } = require("mongoose");
const { generateNGrams } = require("../utils/ngram");

const dimensionsSchema = new Schema(
  {
    width: { type: Number },
    height: { type: Number },
    depth: { type: Number },
    unit: {
      type: String,
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
      // Main Video File (Private/Paid or Public)
      fullVideoUrl: { type: String },
      // Preview Clip / Loop (Public)
      previewVideoUrl: { type: String },
      // Subtitles (VTT/SRT)
      subtitlesUrl: { type: String },
      // Background Audio (MP3/AAC for ambience)
      backgroundAudioUrl: { type: String },
      
      // Metadata
      quality: { 
        type: String, 
        enum: ["8K", "4K", "2K", "1080p", "720p", "High Quality", "Other", "480p", "360p"],
        default: "" 
      },
      synopsis: { type: String, maxlength: 2000 },
      director: { type: String },
      coAuthor: { type: String },
      cast: [{ type: String }],
      productionTeam: [{
        role: { type: String },
        name: { type: String },
        link: { type: String } // Optional portfolio link
      }],
      featuredArtists: [{
        type: Schema.Types.ObjectId,
        ref: "User"
      }],

      // Legacy/Compat fields
      thumbnailUrl: { type: String },
      duration: { type: Number }, // in seconds
      fileSize: { type: Number },
      
      // Access Control
      isPaid: { type: Boolean, default: false },
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
    // Optimization for regex search (includes title, description, artist name)
    searchString: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to populate searchKeywords and searchString
artworkSchema.pre("save", async function () {
  if (this.isModified("title") || this.isModified("description") || this.isModified("artist") || this.isNew) {
    const title = this.title || "";
    const desc = this.description || "";
    
    // N-Grams
    const titleGrams = generateNGrams(title);
    // Removed description from search
    
    let artistGrams = [];
    let artistName = "";
    
    try {
      // Need to fetch artist to get name. Use mongoose.model to avoid circular dependency
      const User = model("User"); 
      const artist = await User.findById(this.artist);
      if (artist) {
        const firstName = artist.firstName || "";
        const lastName = artist.lastName || "";
        const companyName = artist.artistInfo?.companyName || "";
        
        artistName = `${firstName} ${lastName} ${companyName}`.trim();
        
        const firstNameGrams = generateNGrams(firstName);
        const lastNameGrams = generateNGrams(lastName);
        const companyGrams = generateNGrams(companyName);
        
        artistGrams = [...firstNameGrams, ...lastNameGrams, ...companyGrams];
      }
    } catch (err) {
      console.error("Error fetching artist for search indexing:", err);
    }

    this.searchKeywords = [...new Set([...titleGrams, ...artistGrams])];
    
    // Normalized search string for regex fallback
    this.searchString = `${title} ${artistName}`.toLowerCase();
  }
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

// Flag new document and check for status changes for post-save hook
// Flag new document and check for status changes for post-save hook
artworkSchema.pre("save", async function () {
  this.wasNew = this.isNew;

  // Capture previous isForSale state for updates
  if (!this.isNew && this.isModified("isForSale")) {
    try {
      // Need to fetch old doc to know previous state
      const oldDoc = await this.constructor.findById(this._id).select("isForSale");
      if (oldDoc) {
        this.wasForSale = oldDoc.isForSale;
      }
    } catch (err) {
      console.error("Error fetching old artwork in pre-save:", err);
    }
  }
});

artworkSchema.post("save", async function (doc) {
  try {
    const User = model("User");
    const PlatformStats = require("./PlatformStats.model");

    if (this.wasNew) {
      // Update Artist Stats
      await User.findByIdAndUpdate(doc.artist, { $inc: { "stats.artworks": 1 } });

      // Update Platform Stats
      await PlatformStats.updateOne(
        { _id: "global" },
        {
          $inc: {
            "artworks.total": 1,
            "artworks.forSale": doc.isForSale ? 1 : 0,
          },
        },
        { upsert: true }
      );
    } else {
      // Handle updates
      if (this.isModified("isForSale")) {
        // Only if we successfully captured previous state
        if (this.wasForSale !== undefined) {
          const oldVal = this.wasForSale;
          const newVal = doc.isForSale;

          if (oldVal !== newVal) {
            const change = newVal ? 1 : -1;
            await PlatformStats.updateOne(
              { _id: "global" },
              { $inc: { "artworks.forSale": change } }
            );
          }
        }
      }
    }
  } catch (err) {
    console.error("Error updating stats in Artwork post-save hook:", err);
  }
});

artworkSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    try {
      const User = model("User");
      const PlatformStats = require("./PlatformStats.model");

      // Update Artist Stats
      await User.findByIdAndUpdate(doc.artist, { $inc: { "stats.artworks": -1 } });

      // Update Platform Stats
      await PlatformStats.updateOne(
        { _id: "global" },
        {
          $inc: {
            "artworks.total": -1,
            "artworks.forSale": doc.isForSale ? -1 : 0,
          },
        }
      );
    } catch (err) {
      console.error("Error updating stats in Artwork post-delete hook:", err);
    }
  }
});

const Artwork = model("Artwork", artworkSchema);

module.exports = Artwork;
