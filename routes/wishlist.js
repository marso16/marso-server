const express = require("express");
const { body } = require("express-validator");
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  updateWishlist,
  generateShareToken,
  getSharedWishlist,
  checkWishlistStatus,
  clearWishlist,
  moveToCart,
} = require("../controllers/wishlist");
const { protect, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Get user's wishlist
router.get("/", protect, getWishlist);

// Add product to wishlist
router.post(
  "/:productId",
  protect,
  [
    body("notes")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Notes cannot exceed 200 characters"),
  ],
  addToWishlist
);

// Remove product from wishlist
router.delete("/:productId", protect, removeFromWishlist);

// Update wishlist settings
router.put(
  "/",
  protect,
  [
    body("name")
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage("Wishlist name must be between 1 and 50 characters"),
    body("isPublic")
      .optional()
      .isBoolean()
      .withMessage("isPublic must be a boolean"),
  ],
  updateWishlist
);

// Generate share token
router.post("/share", protect, generateShareToken);

// Get shared wishlist
router.get("/shared/:shareToken", getSharedWishlist);

// Check if product is in wishlist
router.get("/check/:productId", optionalAuth, checkWishlistStatus);

// Clear entire wishlist
router.delete("/", protect, clearWishlist);

// Move product from wishlist to cart
router.post(
  "/:productId/move-to-cart",
  protect,
  [
    body("quantity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Quantity must be a positive integer"),
  ],
  moveToCart
);

module.exports = router;
