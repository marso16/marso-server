const { validationResult } = require("express-validator");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const getUserCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name price images stock isActive"
    );

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Filter out inactive products
    cart.items = cart.items.filter(
      (item) => item.product && item.product.isActive
    );

    // Recalculate totals after filtering
    await cart.save();

    res.json(cart);
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: "Server error fetching cart" });
  }
};

const addItemToCart = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { productId, quantity } = req.body;

    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res
        .status(404)
        .json({ message: "Product not found or unavailable" });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        message: "Insufficient stock",
        availableStock: product.stock,
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      // Check total stock availability
      if (product.stock < newQuantity) {
        return res.status(400).json({
          message: "Insufficient stock for total quantity",
          availableStock: product.stock,
          currentInCart: cart.items[existingItemIndex].quantity,
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = product.price;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
      });
    }

    await cart.save();

    // Populate and return updated cart
    await cart.populate("items.product", "name price images stock isActive");

    res.json({
      message: "Item added to cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Invalid product ID" });
    }
    res.status(500).json({ message: "Server error adding item to cart" });
  }
};

const updateCartItemQuantity = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    if (quantity === 0) {
      // Remove item from cart
      cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId
      );
    } else {
      // Check if product exists and is active
      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        return res
          .status(404)
          .json({ message: "Product not found or unavailable" });
      }

      // Check stock availability
      if (product.stock < quantity) {
        return res.status(400).json({
          message: "Insufficient stock",
          availableStock: product.stock,
        });
      }

      // Find and update item
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex >= 0) {
        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].price = product.price;
      } else {
        return res.status(404).json({ message: "Item not found in cart" });
      }
    }

    await cart.save();

    // Populate and return updated cart
    await cart.populate("items.product", "name price images stock isActive");

    res.json({
      message: "Cart updated successfully",
      cart,
    });
  } catch (error) {
    console.error("Update cart error:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Invalid product ID" });
    }
    res.status(500).json({ message: "Server error updating cart" });
  }
};

const removeItemFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Remove item from cart
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    await cart.save();

    // Populate and return updated cart
    await cart.populate("items.product", "name price images stock isActive");

    res.json({
      message: "Item removed from cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Invalid product ID" });
    }
    res.status(500).json({ message: "Server error removing item from cart" });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.clearCart();
    await cart.save();

    res.json({
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ message: "Server error clearing cart" });
  }
};

const getCartItemCount = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    const count = cart ? cart.totalItems : 0;

    res.json({ count });
  } catch (error) {
    console.error("Get cart count error:", error);
    res.status(500).json({ message: "Server error fetching cart count" });
  }
};

module.exports = {
  getUserCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart,
  getCartItemCount,
};
