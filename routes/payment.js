const express = require("express");
const { body } = require("express-validator");
const paymentController = require("../controllers/payment");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/create-intent",
  protect,
  [body("orderId").notEmpty().withMessage("Order ID is required")],
  paymentController.createPaymentIntent
);

router.post(
  "/confirm",
  protect,
  [
    body("paymentIntentId")
      .notEmpty()
      .withMessage("Payment intent ID is required"),
    body("orderId").notEmpty().withMessage("Order ID is required"),
  ],
  paymentController.confirmPayment
);

router.get("/config", paymentController.stripPublishablekey);

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.stripeWebHook
);

router.post(
  "/refund",
  protect,
  [
    body("orderId").notEmpty().withMessage("Order ID is required"),
    body("amount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Amount must be positive"),
  ],
  paymentController.createRefund
);

router.get("/history", protect, paymentController.getPaymentHistoryForUser);

module.exports = router;
