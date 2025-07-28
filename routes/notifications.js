const express = require("express");
const { body } = require("express-validator");
const {
  getNotifications,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  deleteNotification,
  deleteMultipleNotifications,
  getUnreadCount,
  createNotification,
  getNotificationStats,
  cleanupOldNotifications,
} = require("../controllers/notification");
const { protect, admin } = require("../middleware/auth");

const router = express.Router();

// Get user notifications
router.get("/", protect, getNotifications);

// Get unread count
router.get("/unread-count", protect, getUnreadCount);

// Mark notification as read
router.patch("/:notificationId/read", protect, markAsRead);

// Mark multiple notifications as read
router.patch(
  "/read",
  protect,
  [
    body("notificationIds")
      .isArray({ min: 1 })
      .withMessage("notificationIds must be a non-empty array")
      .custom((value) => {
        if (!value.every((id) => typeof id === "string" && id.length === 24)) {
          throw new Error("All notification IDs must be valid ObjectIds");
        }
        return true;
      }),
  ],
  markMultipleAsRead
);

// Mark all notifications as read
router.patch("/read-all", protect, markAllAsRead);

// Delete notification
router.delete("/:notificationId", protect, deleteNotification);

// Delete multiple notifications
router.delete(
  "/",
  protect,
  [
    body("notificationIds")
      .isArray({ min: 1 })
      .withMessage("notificationIds must be a non-empty array")
      .custom((value) => {
        if (!value.every((id) => typeof id === "string" && id.length === 24)) {
          throw new Error("All notification IDs must be valid ObjectIds");
        }
        return true;
      }),
  ],
  deleteMultipleNotifications
);

// Admin routes
// Create notification
router.post(
  "/admin/create",
  protect,
  admin,
  [
    body("recipients").custom((value) => {
      if (value === "all") return true;
      if (Array.isArray(value) && value.length > 0) return true;
      if (typeof value === "string" && value.length === 24) return true;
      throw new Error(
        "Recipients must be 'all', an array of user IDs, or a single user ID"
      );
    }),
    body("type")
      .isIn([
        "order_placed",
        "order_confirmed",
        "order_shipped",
        "order_delivered",
        "order_cancelled",
        "payment_received",
        "payment_failed",
        "product_review",
        "low_stock",
        "new_product",
        "price_drop",
        "promotion",
        "account_update",
        "welcome",
        "system",
      ])
      .withMessage("Invalid notification type"),
    body("title")
      .isLength({ min: 1, max: 100 })
      .withMessage("Title must be between 1 and 100 characters"),
    body("message")
      .isLength({ min: 1, max: 500 })
      .withMessage("Message must be between 1 and 500 characters"),
    body("priority")
      .optional()
      .isIn(["low", "medium", "high", "urgent"])
      .withMessage("Invalid priority level"),
    body("channel")
      .optional()
      .isArray()
      .custom((value) => {
        const validChannels = ["in_app", "email", "push", "sms"];
        if (!value.every((channel) => validChannels.includes(channel))) {
          throw new Error("Invalid notification channel");
        }
        return true;
      }),
    body("actionUrl")
      .optional()
      .isURL()
      .withMessage("Action URL must be a valid URL"),
    body("expiresAt")
      .optional()
      .isISO8601()
      .withMessage("Expiration date must be a valid ISO 8601 date"),
  ],
  createNotification
);

// Get notification statistics
router.get("/admin/stats", protect, admin, getNotificationStats);

// Clean up old notifications
router.delete("/admin/cleanup", protect, admin, cleanupOldNotifications);

module.exports = router;
