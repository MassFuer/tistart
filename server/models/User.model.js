const { Schema, model } = require("mongoose");

const addressSchema = new Schema(
  {
    street: { type: String, trim: true },
    streetNum: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
      },
    },
  },
  { _id: false }
);

const businessHoursSchema = new Schema(
  {
    day: {
      type: String,
      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    },
    open: { type: String }, // e.g., "09:00"
    close: { type: String }, // e.g., "18:00"
    isClosed: { type: Boolean, default: false },
  },
  { _id: false }
);

const socialMediaSchema = new Schema(
  {
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    twitter: { type: String, trim: true },
    website: { type: String, trim: true },
  },
  { _id: false }
);

const policiesSchema = new Schema(
  {
    returnDays: { type: Number, default: 14 },
    freeShippingThreshold: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
  },
  { _id: false }
);

// Storage tracking schema for artists
const storageSchema = new Schema(
  {
    totalBytes: { type: Number, default: 0 },
    imageBytes: { type: Number, default: 0 },
    videoBytes: { type: Number, default: 0 },
    quotaBytes: { type: Number, default: 5 * 1024 * 1024 * 1024 }, // 5GB default
    fileCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const artistInfoSchema = new Schema(
  {
    companyName: { type: String, trim: true },
    tagline: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ["individual", "company"],
      default: "individual",
    },
    taxId: { type: String, trim: true },
    vatNumber: { type: String, trim: true },
    address: { type: addressSchema, default: () => ({}) },
    logo: { type: String }, // Cloudinary URL
    businessHours: [businessHoursSchema],
    socialMedia: { type: socialMediaSchema, default: () => ({}) },
    policies: { type: policiesSchema, default: () => ({}) },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required."],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required."],
      trim: true,
    },
    userName: {
      type: String,
      required: [true, "Username is required."],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Please provide a valid email address."],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationTokenExpires: {
      type: Date,
      default: null,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    profilePicture: {
      type: String, // Cloudinary URL
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "artist", "admin", "superAdmin"],
      default: "user",
    },
    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: "Artwork",
      },
    ],
    cart: [
      {
        artwork: {
          type: Schema.Types.ObjectId,
          ref: "Artwork",
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
      },
    ],
    // Artist-specific fields
    artistStatus: {
      type: String,
      enum: ["none", "pending", "incomplete", "verified", "suspended"],
      default: "none",
    },
    artistInfo: {
      type: artistInfoSchema,
      default: () => ({}),
    },
    // Storage tracking for artists
    storage: {
      type: storageSchema,
      default: () => ({}),
    },
    // Subscription tier (for billing)
    subscriptionTier: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    // Denormalized stats for dashboard
    stats: {
      initialized: { type: Boolean, default: false },
      artworks: { type: Number, default: 0 },
      events: { type: Number, default: 0 },
      sales: { type: Number, default: 0 },
      orders: { type: Number, default: 0 },
      avgRating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
      favorites: { type: Number, default: 0 },
      attending: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON output
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

// Index for efficient queries
userSchema.index({ artistStatus: 1 });
userSchema.index({ role: 1 });

const User = model("User", userSchema);

module.exports = User;
