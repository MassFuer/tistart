const { Schema, model } = require("mongoose");

const videoPurchaseSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    artwork: {
      type: Schema.Types.ObjectId,
      ref: "Artwork",
      required: true,
    },
    // Price paid at time of purchase
    pricePaid: {
      type: Number,
      required: true,
      min: 0,
    },
    // Payment reference (for future Stripe integration)
    paymentId: {
      type: String,
    },
    // Purchase type: 'instant' (quick buy) or 'order' (via checkout)
    purchaseType: {
      type: String,
      enum: ["instant", "order"],
      default: "instant",
    },
    // Reference to order (if purchased via checkout)
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    // For analytics: how the user found this video
    referrer: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: one purchase per user per artwork
videoPurchaseSchema.index({ user: 1, artwork: 1 }, { unique: true });

// Index for querying user's purchases
videoPurchaseSchema.index({ user: 1, createdAt: -1 });

// Index for artist revenue reports
videoPurchaseSchema.index({ artwork: 1, createdAt: -1 });

const VideoPurchase = model("VideoPurchase", videoPurchaseSchema);

module.exports = VideoPurchase;
