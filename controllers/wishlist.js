const { validationResult } = require("express-validator");
const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const mongoose = require("mongoose");

// Get user's wishlist
const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findByUser(req.user._id);

    if (!wishlist) {
      // Create empty wishlist if doesn't exist
      wishlist = new Wishlist({ user: req.user._id });
      await wishlist.save();
    }

    res.json({
      success: true,
      wishlist,
    });
  } catch (error) {
    console.error("Get wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching wishlist",
    });
  }
};

// Add product to wishlist
const addToWishlist = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { productId } = req.params;
    const { notes } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Get or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id });
    }

    // Add product to wishlist
    const added = wishlist.addProduct(productId, notes);
    if (!added) {
      return res.status(400).json({
        success: false,
        message: "Product already in wishlist",
      });
    }

    await wishlist.save();

    // Update product wishlist count
    await Product.findByIdAndUpdate(productId, {
      $inc: { wishlistCount: 1 },
    });

    res.status(201).json({
      success: true,
      message: "Product added to wishlist",
      wishlist,
    });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Server error adding to wishlist",
    });
  }
};

// Remove product from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    const removed = wishlist.removeProduct(productId);
    if (!removed) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist",
      });
    }

    await wishlist.save();

    // Update product wishlist count
    await Product.findByIdAndUpdate(productId, {
      $inc: { wishlistCount: -1 },
    });

    res.json({
      success: true,
      message: "Product removed from wishlist",
      wishlist,
    });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Server error removing from wishlist",
    });
  }
};

// Update wishlist settings
const updateWishlist = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, isPublic } = req.body;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    if (name) wishlist.name = name;
    if (typeof isPublic === "boolean") {
      wishlist.isPublic = isPublic;

      // Generate share token if making public
      if (isPublic && !wishlist.shareToken) {
        wishlist.generateShareToken();
      }
    }

    await wishlist.save();

    res.json({
      success: true,
      message: "Wishlist updated successfully",
      wishlist,
    });
  } catch (error) {
    console.error("Update wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating wishlist",
    });
  }
};

// Generate share token for wishlist
const generateShareToken = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    const shareToken = wishlist.generateShareToken();
    wishlist.isPublic = true;
    await wishlist.save();

    res.json({
      success: true,
      message: "Share token generated successfully",
      shareToken,
      shareUrl: `${req.protocol}://${req.get(
        "host"
      )}/wishlist/shared/${shareToken}`,
    });
  } catch (error) {
    console.error("Generate share token error:", error);
    res.status(500).json({
      success: false,
      message: "Server error generating share token",
    });
  }
};

// Get shared wishlist
const getSharedWishlist = async (req, res) => {
  try {
    const { shareToken } = req.params;

    const wishlist = await Wishlist.findByShareToken(shareToken);
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Shared wishlist not found",
      });
    }

    res.json({
      success: true,
      wishlist,
    });
  } catch (error) {
    console.error("Get shared wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching shared wishlist",
    });
  }
};

// Check if product is in wishlist
const checkWishlistStatus = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!req.user) {
      return res.json({
        success: true,
        inWishlist: false,
      });
    }

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    const inWishlist = wishlist ? wishlist.hasProduct(productId) : false;

    res.json({
      success: true,
      inWishlist,
    });
  } catch (error) {
    console.error("Check wishlist status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error checking wishlist status",
    });
  }
};

// Clear entire wishlist
const clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    // Update product wishlist counts
    const productIds = wishlist.products.map((item) => item.product);
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $inc: { wishlistCount: -1 } }
    );

    wishlist.products = [];
    await wishlist.save();

    res.json({
      success: true,
      message: "Wishlist cleared successfully",
      wishlist,
    });
  } catch (error) {
    console.error("Clear wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Server error clearing wishlist",
    });
  }
};

const moveToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    let { quantity = 1 } = req.body;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    // Validate quantity
    quantity = parseInt(quantity, 10);
    if (isNaN(quantity) || quantity < 1) quantity = 1;

    // Validate user
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found or inactive" });
    }

    // Check stock
    if (product.stock < quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient stock" });
    }

    // Remove from wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist && Array.isArray(wishlist.products)) {
      const originalLength = wishlist.products.length;

      wishlist.products = wishlist.products.filter(
        (item) => item.product.toString() !== productId
      );

      const removed = wishlist.products.length !== originalLength;

      if (removed) {
        await wishlist.save();
        await Product.findByIdAndUpdate(productId, {
          $inc: { wishlistCount: -1 },
        });
      }
    }

    // Add to cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Product moved to cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Move to cart error:", error.message);
    console.error(error.stack);
    return res.status(500).json({
      success: false,
      message: "Server error moving product to cart",
    });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  updateWishlist,
  generateShareToken,
  getSharedWishlist,
  checkWishlistStatus,
  clearWishlist,
  moveToCart,
};
