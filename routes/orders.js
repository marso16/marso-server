const express = require("express");
const { body } = require("express-validator");
const ordersController = require("../controllers/orders");
const { protect, admin } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, admin, ordersController.getAllOrders);
router.get("/my-orders", protect, ordersController.getUserOrder);

router.post(
  "/",
  protect,
  [
    body("shippingAddress.fullName")
      .trim()
      .notEmpty()
      .withMessage("Full name is required"),
    body("shippingAddress.address")
      .trim()
      .notEmpty()
      .withMessage("Address is required"),
    body("shippingAddress.city")
      .trim()
      .notEmpty()
      .withMessage("City is required"),
    body("shippingAddress.state")
      .trim()
      .notEmpty()
      .withMessage("State is required"),
    body("shippingAddress.country")
      .trim()
      .notEmpty()
      .withMessage("Country is required"),
    body("paymentMethod")
      .isIn(["stripe", "paypal", "cash_on_delivery"])
      .withMessage("Invalid payment method"),
  ],
  ordersController.createNewOrder
);

router.get("/:id", protect, ordersController.getOneOrder);

router.put(
  "/:id/status",
  protect,
  admin,
  [
    body("status")
      .isIn([
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ])
      .withMessage("Invalid status"),
  ],
  ordersController.updateOrderStatus
);

router.put("/:id/cancel", protect, ordersController.cancelOrder);

router.delete("/", protect, admin, ordersController.deleteAllOrders);

module.exports = router;
