const { validationResult } = require("express-validator");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/Order");

const createPaymentIntent = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { orderId } = req.body;

    // Get order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized for this order" });
    }

    // Check if order is already paid
    if (order.isPaid) {
      return res.status(400).json({ message: "Order is already paid" });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100), // Convert to cents
      currency: "usd",
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Save payment intent ID to order
    order.stripePaymentIntentId = paymentIntent.id;
    await order.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Create payment intent error:", error);
    res.status(500).json({ message: "Server error creating payment intent" });
  }
};

const confirmPayment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { paymentIntentId, orderId } = req.body;

    // Get order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized for this order" });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      // Mark order as paid
      order.markAsPaid({
        id: paymentIntent.id,
        status: paymentIntent.status,
        update_time: new Date().toISOString(),
        email_address: req.user.email,
      });

      await order.save();

      res.json({
        message: "Payment confirmed successfully",
        order,
      });
    } else {
      res.status(400).json({
        message: "Payment not completed",
        status: paymentIntent.status,
      });
    }
  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(500).json({ message: "Server error confirming payment" });
  }
};

const stripPublishablekey = (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
};

const stripeWebHook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;

      try {
        // Find order by payment intent ID
        const order = await Order.findOne({
          stripePaymentIntentId: paymentIntent.id,
        });

        if (order && !order.isPaid) {
          order.markAsPaid({
            id: paymentIntent.id,
            status: paymentIntent.status,
            update_time: new Date().toISOString(),
            email_address: paymentIntent.receipt_email,
          });

          await order.save();
        }
      } catch (error) {
        console.error("Error processing webhook:", error);
      }
      break;

      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

const createRefund = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { orderId, amount, reason } = req.body;

    // Get order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      order.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized for this order" });
    }

    // Check if order is paid
    if (!order.isPaid || !order.stripePaymentIntentId) {
      return res
        .status(400)
        .json({ message: "Order is not paid or payment intent not found" });
    }

    // Create refund
    const refundAmount = amount
      ? Math.round(amount * 100)
      : Math.round(order.totalPrice * 100);

    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount: refundAmount,
      reason: reason || "requested_by_customer",
    });

    // Update order
    order.status = "refunded";
    order.refundId = refund.id;
    order.refundAmount = refundAmount / 100;

    await order.save();

    res.json({
      message: "Refund processed successfully",
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      },
      order,
    });
  } catch (error) {
    console.error("Refund error:", error);
    res.status(500).json({ message: "Server error processing refund" });
  }
};

const getPaymentHistoryForUser = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
      isPaid: true,
    })
      .select("_id totalPrice paidAt paymentMethod status")
      .sort({ paidAt: -1 })
      .limit(20);

    res.json(orders);
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({ message: "Server error fetching payment history" });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  stripPublishablekey,
  stripeWebHook,
  createRefund,
  getPaymentHistoryForUser,
};
