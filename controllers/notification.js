const { validationResult } = require("express-validator");
const Notification = require("../models/Notification");

// Get user notifications
const getNotifications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type,
      priority,
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === "true",
      type,
      priority,
    };

    const notifications = await Notification.getUserNotifications(
      req.user._id,
      options
    );

    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        currentPage: parseInt(page),
        limit: parseInt(limit),
        hasMore: notifications.length === parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching notifications",
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.markAsRead();
    await notification.save();

    res.json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      success: false,
      message: "Server error marking notification as read",
    });
  }
};

// Mark multiple notifications as read
const markMultipleAsRead = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { notificationIds } = req.body;

    const result = await Notification.markMultipleAsRead(
      req.user._id,
      notificationIds
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark multiple as read error:", error);
    res.status(500).json({
      success: false,
      message: "Server error marking notifications as read",
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      success: false,
      message: "Server error marking all notifications as read",
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await Notification.deleteOne({
      _id: notificationId,
      recipient: req.user._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting notification",
    });
  }
};

// Delete multiple notifications
const deleteMultipleNotifications = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { notificationIds } = req.body;

    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      recipient: req.user._id,
    });

    res.json({
      success: true,
      message: `${result.deletedCount} notifications deleted`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete multiple notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting notifications",
    });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching unread count",
    });
  }
};

// Create notification (Admin only)
const createNotification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      recipients,
      type,
      title,
      message,
      data,
      priority,
      channel,
      actionUrl,
      expiresAt,
    } = req.body;

    let notificationData = {
      sender: req.user._id,
      type,
      title,
      message,
      data,
      priority,
      channel,
      actionUrl,
      expiresAt,
    };

    let notifications;

    if (recipients === "all") {
      // Send to all active users
      const User = require("../models/User");
      const allUsers = await User.find({ isActive: true }, "_id");
      const userIds = allUsers.map((user) => user._id);
      
      notifications = await Notification.createBulkNotifications(
        userIds,
        notificationData
      );
    } else if (Array.isArray(recipients)) {
      // Send to specific users
      notifications = await Notification.createBulkNotifications(
        recipients,
        notificationData
      );
    } else {
      // Send to single user
      notificationData.recipient = recipients;
      notifications = await Notification.createNotification(notificationData);
    }

    res.status(201).json({
      success: true,
      message: "Notification(s) created successfully",
      notifications,
    });
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating notification",
    });
  }
};

// Get notification statistics (Admin only)
const getNotificationStats = async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          unreadNotifications: {
            $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] },
          },
          readNotifications: {
            $sum: { $cond: [{ $eq: ["$isRead", true] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalNotifications: 1,
          unreadNotifications: 1,
          readNotifications: 1,
          readRate: {
            $multiply: [
              { $divide: ["$readNotifications", "$totalNotifications"] },
              100,
            ],
          },
        },
      },
    ]);

    const typeStats = await Notification.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] },
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const priorityStats = await Notification.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] },
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalNotifications: 0,
        unreadNotifications: 0,
        readNotifications: 0,
        readRate: 0,
      },
      typeStats,
      priorityStats,
    });
  } catch (error) {
    console.error("Get notification stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching notification statistics",
    });
  }
};

// Clean up old notifications (Admin only)
const cleanupOldNotifications = async (req, res) => {
  try {
    const { daysOld = 30 } = req.query;

    const result = await Notification.deleteOldNotifications(
      parseInt(daysOld)
    );

    res.json({
      success: true,
      message: `${result.deletedCount} old notifications cleaned up`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Cleanup old notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error cleaning up old notifications",
    });
  }
};

module.exports = {
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
};

