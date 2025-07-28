const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      required: true,
      enum: [
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
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    data: {
      type: mongoose.Schema.Types.Mixed, // Additional data specific to notification type
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    channel: {
      type: [String],
      enum: ["in_app", "email", "push", "sms"],
      default: ["in_app"],
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    pushSent: {
      type: Boolean,
      default: false,
    },
    smsSent: {
      type: Boolean,
      default: false,
    },
    actionUrl: String, // URL to redirect when notification is clicked
    expiresAt: Date, // For temporary notifications
  },
  {
    timestamps: true,
  }
);

// Compound indexes
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to mark as read
notificationSchema.methods.markAsRead = function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
  }
};

// Static method to create notification
notificationSchema.statics.createNotification = async function (notificationData) {
  const {
    recipient,
    sender,
    type,
    title,
    message,
    data = {},
    priority = "medium",
    channel = ["in_app"],
    actionUrl,
    expiresAt,
  } = notificationData;

  const notification = new this({
    recipient,
    sender,
    type,
    title,
    message,
    data,
    priority,
    channel,
    actionUrl,
    expiresAt,
  });

  await notification.save();
  return notification;
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function (
  userId,
  options = {}
) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type,
    priority,
  } = options;

  let filter = { recipient: userId };

  if (unreadOnly) filter.isRead = false;
  if (type) filter.type = type;
  if (priority) filter.priority = priority;

  const skip = (page - 1) * limit;

  return this.find(filter)
    .populate("sender", "name avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to mark multiple notifications as read
notificationSchema.statics.markMultipleAsRead = function (userId, notificationIds) {
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      recipient: userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
  });
};

// Static method to delete old notifications
notificationSchema.statics.deleteOldNotifications = function (daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true,
  });
};

// Static method to create bulk notifications
notificationSchema.statics.createBulkNotifications = async function (
  recipients,
  notificationData
) {
  const notifications = recipients.map((recipientId) => ({
    ...notificationData,
    recipient: recipientId,
  }));

  return this.insertMany(notifications);
};

// Pre-save middleware to set expiration for certain notification types
notificationSchema.pre("save", function (next) {
  if (this.isNew) {
    // Set expiration for promotional notifications
    if (this.type === "promotion" && !this.expiresAt) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7); // Expire in 7 days
      this.expiresAt = expirationDate;
    }

    // Set expiration for system notifications
    if (this.type === "system" && !this.expiresAt) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30); // Expire in 30 days
      this.expiresAt = expirationDate;
    }
  }

  next();
});

module.exports = mongoose.model("Notification", notificationSchema);

