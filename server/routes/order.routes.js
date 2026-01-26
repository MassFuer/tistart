const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User.model");
const Artwork = require("../models/Artwork.model");
const Order = require("../models/Order.model");
const VideoPurchase = require("../models/VideoPurchase.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { sendOrderConfirmationEmail } = require("../utils/email");
const { orderLimiter } = require("../middleware/rateLimit.middleware");

// Platform commission rate (20% by default)
const PLATFORM_FEE_RATE = 0.2;

// POST /api/orders - Create a new order (Checkout)
// Works without MongoDB replica set (no transactions)
// Uses atomic operations for stock management
router.post("/", isAuthenticated, orderLimiter, async (req, res, next) => {
  const stockUpdates = []; // Track updates for manual rollback if needed

  try {
    const { shippingAddress, paymentId } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ error: "Shipping address is required." });
    }

    const user = await User.findById(req.payload._id).populate({
      path: "cart.artwork",
      populate: { path: "artist", select: "_id" },
    });

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty." });
    }

    const orderItems = [];
    let subtotal = 0;
    let platformFeeTotal = 0;

    // Validate stock, isForSale, and calculate totals with commission
    for (const item of user.cart) {
      const artwork = item.artwork;

      if (!artwork) {
        // Rollback stock updates
        for (const update of stockUpdates) {
          await Artwork.findByIdAndUpdate(update.artworkId, {
            $inc: { totalInStock: update.quantity },
          });
        }
        return res
          .status(400)
          .json({ error: "One or more items in cart are no longer available." });
      }

      // Check if item is still for sale
      if (!artwork.isForSale) {
        // Rollback stock updates
        for (const update of stockUpdates) {
          await Artwork.findByIdAndUpdate(update.artworkId, {
            $inc: { totalInStock: update.quantity },
          });
        }
        return res.status(400).json({
          error: `"${artwork.title}" is no longer available for sale.`,
        });
      }

      // Use findOneAndUpdate for atomic stock check and decrement
      const updatedArtwork = await Artwork.findOneAndUpdate(
        {
          _id: artwork._id,
          totalInStock: { $gte: item.quantity }, // Only update if enough stock
        },
        {
          $inc: { totalInStock: -item.quantity },
        },
        { new: true }
      );

      if (!updatedArtwork) {
        // Rollback stock updates made so far
        for (const update of stockUpdates) {
          await Artwork.findByIdAndUpdate(update.artworkId, {
            $inc: { totalInStock: update.quantity },
          });
        }
        // Refetch to get current stock for error message
        const currentArtwork = await Artwork.findById(artwork._id);
        return res.status(400).json({
          error: `Not enough stock for "${artwork.title}". Available: ${currentArtwork?.totalInStock || 0}`,
        });
      }

      // Track this stock update for potential rollback
      stockUpdates.push({ artworkId: artwork._id, quantity: item.quantity });

      // Calculate commission per item
      const itemTotal = artwork.price * item.quantity;
      const itemPlatformFee = Math.round(itemTotal * PLATFORM_FEE_RATE * 100) / 100;
      const itemArtistEarnings = Math.round((itemTotal - itemPlatformFee) * 100) / 100;

      orderItems.push({
        artwork: artwork._id,
        artist: artwork.artist._id || artwork.artist,
        quantity: item.quantity,
        price: artwork.price,
        platformFee: itemPlatformFee,
        artistEarnings: itemArtistEarnings,
      });

      subtotal += itemTotal;
      platformFeeTotal += itemPlatformFee;
    }

    // Round totals
    subtotal = Math.round(subtotal * 100) / 100;
    platformFeeTotal = Math.round(platformFeeTotal * 100) / 100;
    const totalAmount = subtotal; // Total paid by customer

    // Debug logging
    console.log("Order creation debug:", {
      cartItems: user.cart.length,
      orderItems: orderItems.length,
      subtotal,
      totalAmount,
      sampleItem: orderItems[0],
    });

    // Create Order
    const order = await Order.create({
      user: user._id,
      items: orderItems,
      subtotal,
      totalAmount,
      platformFeeTotal,
      platformFeeRate: PLATFORM_FEE_RATE,
      shippingAddress,
      status: "pending", // Changed from "paid" to "pending" for Stripe payment flow
      paymentId: paymentId || "MOCK_PAYMENT",
    });

    // Create VideoPurchase records for video artworks
    for (const item of orderItems) {
      const artwork = await Artwork.findById(item.artwork);
      if (artwork?.video?.url && artwork?.video?.isPaid) {
        // Check if video purchase already exists
        const existingPurchase = await VideoPurchase.findOne({
          user: user._id,
          artwork: item.artwork,
        });

        if (!existingPurchase) {
          await VideoPurchase.create({
            user: user._id,
            artwork: item.artwork,
            pricePaid: item.price,
            paymentId: order.paymentId,
            order: order._id,
            purchaseType: "order",
          });
        }
      }
    }

    // Clear User Cart - NOTE: Only clear after successful payment
    // For now, keep cart items until payment is confirmed
    // TODO: Move cart clearing to payment success webhook
    // user.cart = [];
    // await user.save();

    // Don't send confirmation email here - send after payment is confirmed
    // sendOrderConfirmationEmail(user.email, user.firstName, order).catch((err) => {
    //   console.error("Failed to send order confirmation email:", err);
    // });

    res.status(201).json({
      message: "Order placed successfully!",
      data: order,
    });
  } catch (error) {
    // Attempt to rollback stock updates on unexpected error
    for (const update of stockUpdates) {
      try {
        await Artwork.findByIdAndUpdate(update.artworkId, {
          $inc: { totalInStock: update.quantity },
        });
      } catch (rollbackError) {
        console.error("Failed to rollback stock:", rollbackError);
      }
    }
    next(error);
  }
});

// GET /api/orders/sales - Get sales for the logged-in artist
router.get("/sales", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    
    // Find orders that contain items where the artist is the current user
    const sales = await Order.find({ "items.artist": userId })
      .populate("user", "firstName lastName email profilePicture")
      .populate({
        path: "items.artwork",
        select: "title images price",
      })
      .sort({ createdAt: -1 });

    // Filter items in the orders to return ONLY the items belonging to this artist
    // This is important because an order might contain items from multiple artists
    const sanitizedSales = sales.map(order => {
      const artistItems = order.items.filter(item => 
        item.artist.toString() === userId
      );
      
      const orderObj = order.toObject();
      orderObj.items = artistItems;
      
      // Recalculate total for this artist only
      orderObj.totalAmount = artistItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return orderObj;
    });

    res.status(200).json({ data: sanitizedSales });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/mine - Get my orders
router.get("/mine", isAuthenticated, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.payload._id })
      .populate({
        path: "items.artwork",
        select: "title images artist",
        populate: {
          path: "artist",
          select: "firstName lastName artistInfo.companyName",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ data: orders });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/all - Get all orders (Admin only) - MUST be before /:id
router.get("/all", isAuthenticated, async (req, res, next) => {
  try {
    const isAdminRole = req.payload.role === "admin" || req.payload.role === "superAdmin";
    if (!isAdminRole) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    const { limit = 50, skip = 0, status } = req.query;
    // Enforce max limit to prevent abuse
    const safeLimit = Math.min(Number(limit) || 50, 100);
    const safeSkip = Math.max(Number(skip) || 0, 0);

    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("user", "firstName lastName email")
      .populate({
        path: "items.artwork",
        select: "title price images",
      })
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .skip(safeSkip);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      data: orders,
      pagination: {
        total,
        limit: safeLimit,
        skip: safeSkip,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id - Get single order
router.get("/:id", isAuthenticated, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate({
      path: "items.artwork",
      select: "title images artist",
      populate: {
        path: "artist",
        select: "firstName lastName artistInfo.companyName",
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Check ownership or admin
    const isAdminRole = req.payload.role === "admin" || req.payload.role === "superAdmin";
    if (order.user.toString() !== req.payload._id.toString() && !isAdminRole) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    res.status(200).json({ data: order });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/orders/:id/status - Update order status (Admin only)
// Works without MongoDB replica set
router.patch("/:id/status", isAuthenticated, async (req, res, next) => {
  try {
    const isAdminRole = req.payload.role === "admin" || req.payload.role === "superAdmin";
    if (!isAdminRole) {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }

    const { status, refundReason } = req.body;
    const validStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Prevent changing status of already cancelled orders
    if (order.status === "cancelled" && status !== "cancelled") {
      return res.status(400).json({ error: "Cannot change status of a cancelled order." });
    }

    // Handle cancellation - restore inventory
    if (status === "cancelled" && order.status !== "cancelled") {
      // Restore stock for each item
      for (const item of order.items) {
        await Artwork.findByIdAndUpdate(item.artwork, { $inc: { totalInStock: item.quantity } });
      }

      // Remove video purchase records if any
      await VideoPurchase.deleteMany({ order: order._id });

      order.refundedAt = new Date();
      order.refundReason = refundReason || "Order cancelled by admin";
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      message: `Order status updated to ${status}`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders/:id/confirm-payment - Confirm payment and clear cart
router.post("/:id/confirm-payment", isAuthenticated, async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Verify ownership
    if (order.user.toString() !== req.payload._id.toString()) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    // Update order status to paid
    order.status = "paid";
    await order.save();

    // Clear user cart
    const user = await User.findById(req.payload._id);
    user.cart = [];
    await user.save();

    // Send order confirmation email (async, don't block response)
    sendOrderConfirmationEmail(user.email, user.firstName, order).catch((err) => {
      console.error("Failed to send order confirmation email:", err);
    });

    res.status(200).json({
      message: "Payment confirmed and cart cleared",
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
