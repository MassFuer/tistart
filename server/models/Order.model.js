const { Schema, model } = require("mongoose");

const orderItemSchema = new Schema(
  {
    itemType: {
      type: String,
      enum: ["artwork", "ticket"],
      default: "artwork",
      required: true,
    },
    artwork: {
      type: Schema.Types.ObjectId,
      ref: "Artwork",
      required: function() { return this.itemType === "artwork"; },
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: function() { return this.itemType === "ticket"; },
    },
    artist: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    // Commission tracking per item
    platformFee: {
      type: Number,
      required: true,
      min: 0,
    },
    artistEarnings: {
      type: Number,
      required: true,
      min: 0,
    },
    // Snapshot fields
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String, 
    },
    // Ticket specific
    ticketCode: {
       type: String,
    }
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAddress: {
      street: { type: String, required: function() { return this.status !== 'pending'; } },
      streetNum: { type: String, required: function() { return this.status !== 'pending'; } },
      zipCode: { type: String, required: function() { return this.status !== 'pending'; } },
      city: { type: String, required: function() { return this.status !== 'pending'; } },
      country: { type: String, required: function() { return this.status !== 'pending'; } },
    },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentId: {
      type: String, // Payment ID (will be Stripe PaymentIntent ID)
    },
    // Commission tracking totals
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFeeTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFeeRate: {
      type: Number,
      default: 0.2, // 20% default
    },
    // For refunds
    refundedAt: Date,
    refundReason: String,
  },
  {
    timestamps: true,
  }
);

// Flag paid status change for post-save hook
orderSchema.pre("save", async function () {
  // Check if status changed to 'paid'
  if (this.isModified("status") && this.status === "paid") {
    this.wasJustPaid = true;
  }
});

orderSchema.post("save", async function (doc) {
  try {
    if (this.wasJustPaid) {
      const User = model("User");
      const PlatformStats = require("./PlatformStats.model");

      // 1. Update Buyer Stats
      await User.findByIdAndUpdate(doc.user, { $inc: { "stats.orders": 1 } });

      // 2. Update Artist Stats (Sales)
      // An order can have items from multiple artists.
      // We want to count 1 sale per artist for this order.
      const uniqueArtistIds = [...new Set(doc.items.map((item) => item.artist.toString()))];

      await Promise.all(
        uniqueArtistIds.map((artistId) =>
          User.findByIdAndUpdate(artistId, { $inc: { "stats.sales": 1 } })
        )
      );

      // 3. Update Platform Stats
      await PlatformStats.updateOne(
        { _id: "global" },
        {
          $inc: {
            "orders.total": 1,
            "orders.totalRevenue": doc.totalAmount,
            "orders.totalPlatformFees": doc.platformFeeTotal,
          },
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error("Error updating stats in Order post-save hook:", err);
  }
});

// Indexes for efficient queries
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ "items.artist": 1, status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentId: 1 });

const Order = model("Order", orderSchema);

module.exports = Order;
