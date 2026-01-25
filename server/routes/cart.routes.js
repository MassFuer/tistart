const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const Artwork = require("../models/Artwork.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { cartLimiter } = require("../middleware/rateLimit.middleware");

// GET /api/cart - Get user's cart
router.get("/", isAuthenticated, async (req, res, next) => {
  try {
    const user = await User.findById(req.payload._id).populate({
      path: "cart.artwork",
      select: "title price images artist isForSale totalInStock",
      populate: {
        path: "artist",
        select: "firstName lastName userName artistInfo.companyName",
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Filter out any null artworks (deleted items)
    const validCart = user.cart.filter((item) => item.artwork);
    
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
    const { artworkId, quantity = 1 } = req.body;

    if (!artworkId) {
      return res.status(400).json({ error: "Artwork ID is required." });
    }

    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({ error: "Artwork not found." });
    }

    if (!artwork.isForSale) {
      return res.status(400).json({ error: "This artwork is not for sale." });
    }

    if (quantity > artwork.totalInStock) {
      return res.status(400).json({ error: "Not enough stock available." });
    }

    const user = await User.findById(req.payload._id);
    
    // Check if item already in cart
    const existingItemIndex = user.cart.findIndex(
      (item) => item.artwork.toString() === artworkId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = user.cart[existingItemIndex].quantity + Number(quantity);
      
      // Check stock limit for total quantity
      if (newQuantity > artwork.totalInStock) {
        return res.status(400).json({ error: "Cannot add more than available stock." });
      }
      
      user.cart[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      user.cart.push({ artwork: artworkId, quantity: Number(quantity) });
    }

    await user.save();
    
    // Return updated cart with artist populated
    const updatedUser = await User.findById(req.payload._id).populate({
      path: "cart.artwork",
      select: "title price images artist isForSale totalInStock",
      populate: {
        path: "artist",
        select: "firstName lastName userName artistInfo.companyName",
      },
    });

    res.status(200).json({
      message: "Item added to cart",
      data: updatedUser.cart
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/cart/update - Update item quantity
router.patch("/update", isAuthenticated, cartLimiter, async (req, res, next) => {
  try {
    const { artworkId, quantity } = req.body;

    if (!artworkId || quantity === undefined) {
      return res.status(400).json({ error: "Artwork ID and quantity are required." });
    }

    const newQuantity = Number(quantity);
    if (newQuantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1." });
    }

    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({ error: "Artwork not found." });
    }

    if (newQuantity > artwork.totalInStock) {
      return res.status(400).json({ error: `Only ${artwork.totalInStock} items available.` });
    }

    const user = await User.findById(req.payload._id);
    const itemIndex = user.cart.findIndex(
      (item) => item.artwork.toString() === artworkId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in cart." });
    }

    user.cart[itemIndex].quantity = newQuantity;
    await user.save();

    // Return updated cart with artist populated
    const updatedUser = await User.findById(req.payload._id).populate({
      path: "cart.artwork",
      select: "title price images artist isForSale totalInStock",
      populate: {
        path: "artist",
        select: "firstName lastName userName artistInfo.companyName",
      },
    });

    res.status(200).json({
      message: "Cart updated",
      data: updatedUser.cart
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/remove/:artworkId - Remove item from cart
router.delete("/remove/:artworkId", isAuthenticated, cartLimiter, async (req, res, next) => {
  try {
    const user = await User.findById(req.payload._id);

    user.cart = user.cart.filter(
      (item) => item.artwork.toString() !== req.params.artworkId
    );

    await user.save();

    // Return updated cart with artist populated
    const updatedUser = await User.findById(req.payload._id).populate({
      path: "cart.artwork",
      select: "title price images artist isForSale totalInStock",
      populate: {
        path: "artist",
        select: "firstName lastName userName artistInfo.companyName",
      },
    });

    res.status(200).json({
      message: "Item removed from cart",
      data: updatedUser.cart
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
