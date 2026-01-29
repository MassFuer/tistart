const { Schema, model } = require("mongoose");

const platformStatsSchema = new Schema(
  {
    _id: {
      type: String,
      default: "global",
    },
    initialized: {
      type: Boolean,
      default: false,
    },
    users: {
      total: { type: Number, default: 0 },
      artists: { type: Number, default: 0 },
    },
    artworks: {
      total: { type: Number, default: 0 },
      forSale: { type: Number, default: 0 },
    },
    events: {
      total: { type: Number, default: 0 },
    },
    orders: {
      total: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      totalPlatformFees: { type: Number, default: 0 },
    },
    storage: {
      totalBytes: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

// Singleton helper
platformStatsSchema.statics.getStats = async function () {
  let stats = await this.findById("global");
  if (!stats) {
    stats = await this.create({ _id: "global" });
  }
  return stats;
};

const PlatformStats = model("PlatformStats", platformStatsSchema);

module.exports = PlatformStats;
