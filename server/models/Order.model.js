const { Schema, model } = require("mongoose");

const orderItemSchema = new Schema(
  {
    artwork: {
      type: Schema.Types.ObjectId,
      ref: "Artwork",
      required: true,
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
      street: { type: String, required: true },
      streetNum: { type: String, required: true },
      zipCode: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true },
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
      default: 0.20, // 20% default
    },
    // For refunds
    refundedAt: Date,
    refundReason: String,
  },
  {
    timestamps: true,
  }
);

const Order = model("Order", orderSchema);

module.exports = Order;
