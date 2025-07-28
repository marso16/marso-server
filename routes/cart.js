const express = require("express");
const { body } = require("express-validator");
const { protect } = require("../middleware/auth");
const cartController = require("../controllers/cart");
const router = express.Router();

router.get("/", protect, cartController.getUserCart);

router.post(
  "/add",
  protect,
  [
    body("productId").notEmpty().withMessage("Product ID is required"),
    body("quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
  ],
  cartController.addItemToCart
);

router.put(
  "/update",
  protect,
  [
    body("productId").notEmpty().withMessage("Product ID is required"),
    body("quantity")
      .isInt({ min: 0 })
      .withMessage("Quantity must be non-negative"),
  ],
  cartController.updateCartItemQuantity
);

router.delete("/remove/:productId", protect, cartController.removeItemFromCart);
router.delete("/clear", protect, cartController.clearCart);
router.get("/count", protect, cartController.getCartItemCount);

module.exports = router;
