const { Schema, model } = require("mongoose");

const platformSettingsSchema = new Schema(
  {
    // Singleton identifier - always "global"
    _id: {
      type: String,
      default: "global",
    },

    // Commission & Fees
    platformCommission: {
      type: Number,
      default: 20, // 20% default commission
      min: 0,
      max: 100,
    },

    // Storage Quotas (in bytes)
    storage: {
      defaultQuotaBytes: {
        type: Number,
        default: 5 * 1024 * 1024 * 1024, // 5GB default
      },
      maxImageSizeMB: {
        type: Number,
        default: 10, // 10MB max per image
      },
      maxVideoSizeMB: {
        type: Number,
        default: 500, // 500MB max per video
      },
      allowedImageFormats: {
        type: [String],
        default: ["jpg", "jpeg", "png", "webp", "gif"],
      },
      allowedVideoFormats: {
        type: [String],
        default: ["mp4", "webm", "mov", "avi"],
      },
    },

    // Subscription Tiers (for future billing)
    subscriptionTiers: [
      {
        name: {
          type: String,
          required: true,
        },
        storageQuotaBytes: {
          type: Number,
          required: true,
        },
        monthlyPriceUSD: {
          type: Number,
          required: true,
        },
        commissionRate: {
          type: Number,
          required: true,
        },
        features: [String],
      },
    ],

    // Platform Features Toggle
    features: {
      videoUploadsEnabled: {
        type: Boolean,
        default: true,
      },
      eventsEnabled: {
        type: Boolean,
        default: true,
      },
      reviewsEnabled: {
        type: Boolean,
        default: true,
      },
      ordersEnabled: {
        type: Boolean,
        default: true,
      },
      artistApplicationsEnabled: {
        type: Boolean,
        default: true,
      },
    },

    // Rate Limiting Config
    rateLimits: {
      authMaxAttempts: {
        type: Number,
        default: 5,
      },
      authWindowMinutes: {
        type: Number,
        default: 15,
      },
      apiMaxRequests: {
        type: Number,
        default: 100,
      },
      apiWindowMinutes: {
        type: Number,
        default: 1,
      },
    },

    // Email Configuration
    email: {
      fromName: {
        type: String,
        default: "Nemesis Art Platform",
      },
      fromEmail: {
        type: String,
        default: "noreply@nemesis.art",
      },
      supportEmail: {
        type: String,
        default: "support@nemesis.art",
      },
    },

    // Geolocation Settings
    geolocation: {
      defaultMapCenter: {
        lat: { type: Number, default: 48.8566 }, // Paris
        lng: { type: Number, default: 2.3522 },
      },
      defaultMapZoom: {
        type: Number,
        default: 12,
      },
      enableGeocoding: {
        type: Boolean,
        default: true,
      },
    },

    // Maintenance Mode
    maintenance: {
      enabled: {
        type: Boolean,
        default: false,
      },
      message: {
        type: String,
        default: "Platform is under maintenance. Please check back soon.",
      },
      allowedIPs: [String], // IPs that can bypass maintenance mode
    },

    // Theme Customization
    theme: {
      primary: { type: String, default: "240 5.9% 10%" },
      radius: { type: String, default: "0.5rem" },
      fontFamily: { type: String, default: "Inter" },
      cssVarsLight: { type: Map, of: String, default: {} },
      cssVarsDark: { type: Map, of: String, default: {} },
    },

    // Display & Formatting Preferences
    display: {
      defaultCurrency: { type: String, default: "EUR" },
      defaultPageSize: { type: Number, default: 12 },
      pageSizeOptions: { type: [Number], default: [8, 12, 24, 48] },
      calendarColors: {
        exhibition: { type: String, default: "#3b82f6" },
        workshop: { type: String, default: "#10b981" },
        concert: { type: String, default: "#f59e0b" },
        festival: { type: String, default: "#ef4444" },
        default: { type: String, default: "#6366f1" },
      },
      artistStatusColors: {
        verified: { type: String, default: "#22c55e" },
        pending: { type: String, default: "#f59e0b" },
        rejected: { type: String, default: "#ef4444" },
        notApplied: { type: String, default: "#6b7280" },
      },
    },

    // Hero Section Configuration
    hero: {
      videoUrl: { type: String, default: "https://cdn.fuer.fr/platform/hero/1769675533651-8a01626e4d5d0aec493b89bf00c594f0.mp4" }, // Full URL to R2
      mobileVideoUrl: { type: String, default: "" }, // Optional optimized video
      text: { type: String, default: "VIDEO ARTWORKS" }, // Text for the Video Hero mask
      textSize: { type: String, default: "15vw" }, // Custom text size (e.g., "15vw", "12rem")
      backgroundSoundUrl: { type: String, default: "https://cdn.fuer.fr/platform/hero/1769675604532-a3b7ae66411d1a39dfac3f62f482ba4e.mp3" },
    },

    // Last updated by
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    _id: false, // We manage _id ourselves (always "global")
  }
);

// Static method to get or create the singleton settings
platformSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findById("global");
  if (!settings) {
    settings = await this.create({
      _id: "global",
      subscriptionTiers: [
        {
          name: "Free",
          storageQuotaBytes: 1 * 1024 * 1024 * 1024, // 1GB
          monthlyPriceUSD: 0,
          commissionRate: 25,
          features: ["Basic profile", "Up to 10 artworks", "Community support"],
        },
        {
          name: "Pro",
          storageQuotaBytes: 10 * 1024 * 1024 * 1024, // 10GB
          monthlyPriceUSD: 9.99,
          commissionRate: 15,
          features: ["Verified badge", "Up to 100 artworks", "Video uploads", "Priority support"],
        },
        {
          name: "Enterprise",
          storageQuotaBytes: 100 * 1024 * 1024 * 1024, // 100GB
          monthlyPriceUSD: 49.99,
          commissionRate: 10,
          features: ["Custom branding", "Unlimited artworks", "API access", "Dedicated support"],
        },
      ],
    });
  }
  return settings;
};

// Static method to update settings
platformSettingsSchema.statics.updateSettings = async function (updates, userId) {
  const settings = await this.findByIdAndUpdate(
    "global",
    { ...updates, lastUpdatedBy: userId },
    { new: true, upsert: true, runValidators: true }
  );
  return settings;
};

const PlatformSettings = model("PlatformSettings", platformSettingsSchema);

module.exports = PlatformSettings;
