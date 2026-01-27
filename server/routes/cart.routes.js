const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const Artwork = require("../models/Artwork.model");
const Event = require("../models/Event.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { cartLimiter } = require("../middleware/rateLimit.middleware");

// GET /api/cart - Get user's cart
router.get("/", isAuthenticated, async (req, res, next) => {
  try {
    const user = await User.findById(req.payload._id)
      .populate({
        path: "cart.artwork",
        select: "title price images artist isForSale totalInStock",
        populate: {
          path: "artist",
          select: "firstName lastName userName artistInfo.companyName",
        },
      })
      .populate({
        path: "cart.event",
        select: "title price location startDateTime endDateTime artist maxCapacity attendees",
        populate: {
          path: "artist",
          select: "firstName lastName userName artistInfo.companyName",
        },
      });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Filter out any null items (deleted artworks/events)
    // Keep item if: (type is artwork AND artwork exists) OR (type is ticket AND event exists)
    const validCart = user.cart.filter((item) => {
        if (item.itemType === "ticket") return !!item.event;
        return !!item.artwork;
    });

    // If we filtered out items, save the user
    if (validCart.length !== user.cart.length) {
      user.cart = validCart;
      await user.save();
    }

    res.status(200).json({ data: validCart });
  } catch (error) {
    next(error);
  }
});

// POST /api/cart/add - Add item to cart
router.post("/add", isAuthenticated, cartLimiter, async (req, res, next) => {
  try {
    const { artworkId, eventId, quantity = 1 } = req.body;

    if (!artworkId && !eventId) {
      return res.status(400).json({ error: "Artwork ID or Event ID is required." });
    }

    const user = await User.findById(req.payload._id);
    let newItem = {};

    // --- HANDLE ARTWORK ---
    if (artworkId) {
      const artwork = await Artwork.findById(artworkId);
      if (!artwork) return res.status(404).json({ error: "Artwork not found." });
      if (!artwork.isForSale) return res.status(400).json({ error: "This artwork is not for sale." });
      if (quantity > artwork.totalInStock) return res.status(400).json({ error: "Not enough stock available." });

      const existingItemIndex = user.cart.findIndex(
        (item) => item.itemType === "artwork" && item.artwork?.toString() === artworkId
      );

      if (existingItemIndex > -1) {
        const newQuantity = user.cart[existingItemIndex].quantity + Number(quantity);
        if (newQuantity > artwork.totalInStock) {
          return res.status(400).json({ error: "Cannot add more than available stock." });
        }
        user.cart[existingItemIndex].quantity = newQuantity;
      } else {
        user.cart.push({ itemType: "artwork", artwork: artworkId, quantity: Number(quantity) });
      }
    }

    // --- HANDLE EVENT (TICKET) ---
    else if (eventId) {
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ error: "Event not found." });
      if (new Date(event.endDateTime) < new Date()) {
          return res.status(400).json({ error: "Cannot buy tickets for past events." });
      }
      if (event.price === 0) {
           return res.status(400).json({ error: "Free events do not require a ticket purchase. Please join directly." });
      }

      // Check capacity
      const currentAttendees = event.attendees ? event.attendees.length : 0;
      if (event.maxCapacity > 0 && currentAttendees + Number(quantity) > event.maxCapacity) {
           return res.status(400).json({ error: "Not enough tickets available." });
      }

      // Check if already in cart
      const existingItemIndex = user.cart.findIndex(
        (item) => item.itemType === "ticket" && item.event?.toString() === eventId
      );

      if (existingItemIndex > -1) {
         const newQuantity = user.cart[existingItemIndex].quantity + Number(quantity);
         if (newQuantity > 3) {
             return res.status(400).json({ error: "You can only purchase a maximum of 3 tickets per event." });
         }
         user.cart[existingItemIndex].quantity = newQuantity;
      } else {
        if (Number(quantity) > 3) {
             return res.status(400).json({ error: "You can only purchase a maximum of 3 tickets per event." });
        }
        user.cart.push({ itemType: "ticket", event: eventId, quantity: Number(quantity) });
      }
    }

    await user.save();

    // Return updated cart
    const updatedUser = await User.findById(req.payload._id)
      .populate({
        path: "cart.artwork",
        select: "title price images artist isForSale totalInStock",
        populate: { path: "artist", select: "firstName lastName userName artistInfo.companyName" },
      })
      .populate({
        path: "cart.event",
        select: "title price location startDateTime endDateTime artist maxCapacity attendees",
        populate: { path: "artist", select: "firstName lastName userName artistInfo.companyName" },
      });

    // Filter nulls again just in case
    const validCart = updatedUser.cart.filter((item) => {
        if (item.itemType === "ticket") return !!item.event;
        return !!item.artwork;
    });

    res.status(200).json({
      message: "Item added to cart",
      data: validCart,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/cart/update - Update item quantity
router.patch("/update", isAuthenticated, cartLimiter, async (req, res, next) => {
  try {
    const { artworkId, eventId, quantity } = req.body;

    if ((!artworkId && !eventId) || quantity === undefined) {
      return res.status(400).json({ error: "Item ID and quantity are required." });
    }

    const newQuantity = Number(quantity);
    if (newQuantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1." });
    }

    const user = await User.findById(req.payload._id);
    let itemIndex = -1;

    if (artworkId) {
        const artwork = await Artwork.findById(artworkId);
        if (!artwork) return res.status(404).json({ error: "Artwork not found." });
        if (newQuantity > artwork.totalInStock) return res.status(400).json({ error: `Only ${artwork.totalInStock} items available.` });
        
        itemIndex = user.cart.findIndex(item => item.itemType === "artwork" && item.artwork?.toString() === artworkId);
    } else if (eventId) {
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ error: "Event not found." });
        
        const currentAttendees = event.attendees ? event.attendees.length : 0;
        // Logic check: user might already have tickets in cart, we should check total. 
        // But here we are setting absolute quantity for this cart line item.
        // We really need to know *difference* to check availability accurately, or check absolute `newQuantity` + `currentAttendees` (minus what they already held? too complex).
        // Simple check:
        if (event.maxCapacity > 0 && currentAttendees + newQuantity > event.maxCapacity) {
             return res.status(400).json({ error: "Not enough tickets available." });
        }
        
        itemIndex = user.cart.findIndex(item => item.itemType === "ticket" && item.event?.toString() === eventId);
    }

    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in cart." });
    }

    user.cart[itemIndex].quantity = newQuantity;
    await user.save();

    // Return updated cart
    const updatedUser = await User.findById(req.payload._id)
      .populate({
        path: "cart.artwork",
        select: "title price images artist isForSale totalInStock",
        populate: { path: "artist", select: "firstName lastName userName artistInfo.companyName" },
      })
      .populate({
        path: "cart.event",
        select: "title price location startDateTime endDateTime artist maxCapacity attendees",
        populate: { path: "artist", select: "firstName lastName userName artistInfo.companyName" },
      });

    const validCart = updatedUser.cart.filter((item) => {
        if (item.itemType === "ticket") return !!item.event;
        return !!item.artwork;
    });

    res.status(200).json({
      message: "Cart updated",
      data: validCart,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/remove/:itemId - Remove item from cart
router.delete("/remove/:itemId", isAuthenticated, cartLimiter, async (req, res, next) => {
  try {
    const user = await User.findById(req.payload._id);
    const itemId = req.params.itemId;

    // Filter out item matching either artwork OR event ID
    user.cart = user.cart.filter((item) => {
        const aId = item.artwork?.toString();
        const eId = item.event?.toString();
        return aId !== itemId && eId !== itemId;
    });

    await user.save();

    const updatedUser = await User.findById(req.payload._id)
      .populate({
        path: "cart.artwork",
        select: "title price images artist isForSale totalInStock",
        populate: { path: "artist", select: "firstName lastName userName artistInfo.companyName" },
      })
      .populate({
        path: "cart.event",
        select: "title price location startDateTime endDateTime artist maxCapacity attendees",
        populate: { path: "artist", select: "firstName lastName userName artistInfo.companyName" },
      });

    const validCart = updatedUser.cart.filter((item) => {
        if (item.itemType === "ticket") return !!item.event;
        return !!item.artwork;
    });

    res.status(200).json({
      message: "Item removed from cart",
      data: validCart,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/clear - Clear entire cart
router.delete("/clear", isAuthenticated, async (req, res, next) => {
  try {
    const user = await User.findById(req.payload._id);
    user.cart = [];
    await user.save();
    res.status(200).json({ message: "Cart cleared", data: [] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
