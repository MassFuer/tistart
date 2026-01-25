const router = require("express").Router();
const Order = require("../models/Order.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

// Initialize Stripe (handle missing key gracefully)
const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;

// Create PaymentIntent for an order
// POST /api/payments/create-intent
router.post("/create-intent", isAuthenticated, async (req, res, next) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Payment processing not configured" });
    }

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Verify the order belongs to the user
    if (order.user.toString() !== req.payload._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Check if order is already paid
    if (order.status !== "pending") {
      return res.status(400).json({ error: "Order is not pending payment" });
    }

    // Check if there's already a PaymentIntent for this order
    if (order.paymentId) {
      // Retrieve existing PaymentIntent
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(order.paymentId);
        if (existingIntent.status !== "succeeded" && existingIntent.status !== "canceled") {
          // Return existing intent's client secret
          return res.json({
            data: {
              clientSecret: existingIntent.client_secret,
              paymentIntentId: existingIntent.id,
            },
          });
        }
      } catch (stripeError) {
        // PaymentIntent not found or error, create new one
        console.log("Creating new PaymentIntent, previous one invalid");
      }
    }

    // Create a new PaymentIntent
    // Amount must be in cents (smallest currency unit)
    const amountInCents = Math.round(order.totalAmount * 100);

    // Debug logging
    console.log("PaymentIntent creation debug:", {
      orderId: order._id,
      totalAmount: order.totalAmount,
      amountInCents,
      orderStatus: order.status,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: {
        orderId: order._id.toString(),
        userId: req.payload._id.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Save PaymentIntent ID to order
    order.paymentId = paymentIntent.id;
    await order.save();

    res.json({
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (error) {
    console.error("Error creating PaymentIntent:", error);
    next(error);
  }
});

// Get payment status for an order
// GET /api/payments/:orderId
router.get("/:orderId", isAuthenticated, async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Verify ownership or admin
    const isOwner = order.user.toString() === req.payload._id.toString();
    const isAdmin = req.payload.role === "admin" || req.payload.role === "superAdmin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let paymentStatus = null;

    if (order.paymentId && stripe) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentId);
        paymentStatus = {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency,
        };
      } catch (stripeError) {
        console.error("Error retrieving PaymentIntent:", stripeError);
      }
    }

    res.json({
      data: {
        orderId: order._id,
        orderStatus: order.status,
        paymentId: order.paymentId,
        paymentStatus,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
