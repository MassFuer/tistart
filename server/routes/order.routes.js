const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User.model");
const Artwork = require("../models/Artwork.model");
const Order = require("../models/Order.model");
const Event = require("../models/Event.model");
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
  // #swagger.tags = ['Orders']
  const stockUpdates = []; // Track updates for manual rollback if needed

  try {
    const { shippingAddress, paymentId } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ error: "Shipping address is required." });
    }

    const user = await User.findById(req.payload._id)
      .populate({
        path: "cart.artwork",
        populate: { path: "artist", select: "_id" },
      })
      .populate({
        path: "cart.event",
        populate: { path: "artist", select: "_id" }, // Event artist
      });

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty." });
    }

    const orderItems = [];
    let subtotal = 0;
    let platformFeeTotal = 0;

    // Validate stock, isForSale, and calculate totals with commission
    for (const item of user.cart) {
      // --- HANDLE ARTWORK ---
      if (item.itemType === "artwork") {
        const artwork = item.artwork;

        if (!artwork) {
          await rollbackStocks(stockUpdates);
          return res
            .status(400)
            .json({ error: "One or more items in cart are no longer available." });
        }
        if (!artwork.isForSale) {
          await rollbackStocks(stockUpdates);
          return res
            .status(400)
            .json({ error: `"${artwork.title}" is no longer available for sale.` });
        }

        // Atomic stock update
        const updatedArtwork = await Artwork.findOneAndUpdate(
          { _id: artwork._id, totalInStock: { $gte: item.quantity } },
          { $inc: { totalInStock: -item.quantity } },
          { new: true }
        );

        if (!updatedArtwork) {
          await rollbackStocks(stockUpdates);
          const currentArtwork = await Artwork.findById(artwork._id);
          return res.status(400).json({
            error: `Not enough stock for "${artwork.title}". Available: ${currentArtwork?.totalInStock || 0}`,
          });
        }

        stockUpdates.push({ type: "artwork", id: artwork._id, quantity: item.quantity });

        const itemTotal = artwork.price * item.quantity;
        const platformFee = itemTotal * PLATFORM_FEE_RATE;
        const artistEarnings = itemTotal - platformFee;

        subtotal += itemTotal;
        platformFeeTotal += platformFee;

        orderItems.push({
          itemType: "artwork",
          artwork: artwork._id,
          title: artwork.title,
          price: artwork.price,
          quantity: item.quantity,
          image: artwork.images?.[0],
          artist: artwork.artist._id, // Artist ID for payout calc
          artistEarnings,
          platformFee,
        });
      }

      // --- HANDLE TICKET ---
      else if (item.itemType === "ticket") {
        const event = item.event;
        if (!event) {
          await rollbackStocks(stockUpdates);
          return res
            .status(400)
            .json({ error: "One or more events in cart are no longer available." });
        }
        if (new Date(event.endDateTime) < new Date()) {
          await rollbackStocks(stockUpdates);
          return res.status(400).json({ error: `"${event.title}" has already ended.` });
        }

        // Check user ticket limit (Max 3 per event)
        const userTicketCount = event.attendees
          ? event.attendees.filter((a) => a.user && a.user.toString() === req.payload._id).length
          : 0;
        if (userTicketCount + item.quantity > 3) {
          await rollbackStocks(stockUpdates);
          return res
            .status(400)
            .json({
              error: `You can only hold a maximum of 3 tickets for "${event.title}". You already have ${userTicketCount}.`,
            });
        }

        // Generate Ticket Codes & Attendee Objects
        const newAttendees = [];
        const ticketCodes = [];
        for (let i = 0; i < item.quantity; i++) {
          const code = `${event._id.toString().slice(-4).toUpperCase()}-${Date.now().toString().slice(-6)}-${i + 1}`;
          ticketCodes.push(code);
          newAttendees.push({
            user: req.payload._id,
            status: "confirmed",
            ticketCode: code,
          });
        }

        // Atomic Attendee Add
        const query = { _id: event._id };

        // Strict Capacity Check: current size + new quantity <= maxCapacity
        if (event.maxCapacity > 0) {
          query.$expr = {
            $lte: [{ $add: [{ $size: "$attendees" }, item.quantity] }, event.maxCapacity],
          };
        }

        const updatedEvent = await Event.findOneAndUpdate(
          query,
          { $push: { attendees: { $each: newAttendees } } },
          { new: true }
        );

        if (!updatedEvent) {
          await rollbackStocks(stockUpdates);
          return res
            .status(400)
            .json({
              error: `Checking out tickets for "${event.title}" failed. Event may be full.`,
            });
        }

        stockUpdates.push({ type: "event", id: event._id, ticketCodes: ticketCodes });

        const itemTotal = event.price * item.quantity;
        const platformFee = itemTotal * PLATFORM_FEE_RATE;
        const artistEarnings = itemTotal - platformFee;

        subtotal += itemTotal;
        platformFeeTotal += platformFee;

        // Push one order item representing the batch of tickets
        orderItems.push({
          itemType: "ticket",
          event: event._id,
          title: event.title,
          ticketCode: ticketCodes.join(", "), // Store all codes comma separated? Or just first? Order model has string.
          // Logic check: Order.model orderItemSchema has ticketCode: String.
          // If multiple, maybe comma separate or change schema?
          // For simplicity now: comma separate.
          price: event.price,
          quantity: item.quantity,
          image: event.image,
          artist: event.artist._id,
          artistEarnings,
          platformFee,
        });
      }
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
      if (item.itemType === "artwork") {
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
    // If order was created but this failed, we technically should delete the order too,
    // but for now let's just ensure stock correctness if the process aborted early.
    // If Order.create succeeded, rolling back stock is BAD unless we delete order.
    // Ideally use transactions.

    // Simplistic check: If error came from Order.create or before, we rollback.
    // If error came after (VideoPurchase), we probably shouldn't rollback stock without handling the order.
    // But since node.js crash stops execution, we assume mostly failures happen before completion.

    console.error("Order creation failed:", error);
    await rollbackStocks(stockUpdates).catch((err) => console.error("Rollback failed:", err));
    next(error);
  }
});

// GET /api/orders/sales - Get sales for the logged-in artist
router.get("/sales", isAuthenticated, async (req, res, next) => {
  // #swagger.tags = ['Orders']
  try {
    const userId = req.payload._id;

    // Find orders that contain items where the artist is the current user
    const sales = await Order.find({ "items.artist": userId })
      .populate("user", "firstName lastName email profilePicture")
      .populate({
        path: "items.artwork",
        select: "title images price",
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filter items in the orders to return ONLY the items belonging to this artist
    // This is important because an order might contain items from multiple artists
    const sanitizedSales = sales.map((order) => {
      const artistItems = order.items.filter((item) => item.artist.toString() === userId);

      const orderObj = { ...order };
      orderObj.items = artistItems;

      // Recalculate total for this artist only
      orderObj.totalAmount = artistItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      return orderObj;
    });

    res.status(200).json({ data: sanitizedSales });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/mine - Get my orders
router.get("/mine", isAuthenticated, async (req, res, next) => {
  // #swagger.tags = ['Orders']
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
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ data: orders });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/all - Get all orders (Admin only) - MUST be before /:id
router.get("/all", isAuthenticated, async (req, res, next) => {
  // #swagger.tags = ['Orders']
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
      .skip(safeSkip)
      .lean();

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
router.get(
  "/:id",
  // #swagger.tags = ['Orders']
  isAuthenticated,
  async (req, res, next) => {
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
  }
);

// PATCH /api/orders/:id/status - Update order status (Admin only)
// Works without MongoDB replica set
router.patch("/:id/status", isAuthenticated, async (req, res, next) => {
  // #swagger.tags = ['Orders']
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
  // #swagger.tags = ['Orders']
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

// Helper to rollback stock/attendee updates
async function rollbackStocks(updates) {
  for (const update of updates) {
    if (update.type === "artwork") {
      await Artwork.findByIdAndUpdate(update.id, {
        $inc: { totalInStock: update.quantity },
      });
    } else if (update.type === "event") {
      // Pull specific ticket codes to avoid removing pre-existing tickets
      await Event.findByIdAndUpdate(update.id, {
        $pull: { attendees: { ticketCode: { $in: update.ticketCodes } } },
      });
    }
  }
}

module.exports = router;
