const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

// Common validation rules
const validateObjectId = (field) => {
  return param(field)
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(`Invalid ${field} ID`);
      }
      return true;
    });
};

const validateEmail = () => {
  return body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address");
};

const validatePassword = () => {
  return body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
};

const validateName = () => {
  return body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces");
};

const validatePhone = () => {
  return body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number");
};

// Product validation rules
const validateProduct = () => {
  return [
    body("name")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Product name must be between 1 and 100 characters"),
    body("description")
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage("Product description must be between 10 and 2000 characters"),
    body("price")
      .isFloat({ min: 0.01 })
      .withMessage("Price must be a positive number"),
    body("originalPrice")
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage("Original price must be a positive number"),
    body("category")
      .isIn([
        "Electronics",
        "Clothing",
        "Books",
        "Home & Garden",
        "Sports & Outdoors",
        "Beauty & Personal Care",
        "Toys & Games",
        "Automotive",
        "Health & Wellness",
        "Food & Beverages",
        "Other",
      ])
      .withMessage("Invalid product category"),
    body("stock")
      .isInt({ min: 0 })
      .withMessage("Stock must be a non-negative integer"),
    body("brand")
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage("Brand name cannot exceed 50 characters"),
    body("weight")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Weight must be a non-negative number"),
    body("tags")
      .optional()
      .isArray()
      .withMessage("Tags must be an array"),
    body("tags.*")
      .optional()
      .trim()
      .isLength({ min: 1, max: 30 })
      .withMessage("Each tag must be between 1 and 30 characters"),
  ];
};

// Review validation rules
const validateReview = () => {
  return [
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment")
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage("Review comment must be between 10 and 500 characters"),
  ];
};

// Address validation rules
const validateAddress = () => {
  return [
    body("name")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Address name must be between 1 and 50 characters"),
    body("street")
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage("Street address must be between 5 and 100 characters"),
    body("city")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("City must be between 2 and 50 characters"),
    body("state")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("State must be between 2 and 50 characters"),
    body("country")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Country must be between 2 and 50 characters"),
    body("postalCode")
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage("Postal code must be between 3 and 20 characters"),
    body("phone")
      .optional()
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),
    body("type")
      .optional()
      .isIn(["home", "work", "other"])
      .withMessage("Address type must be home, work, or other"),
  ];
};

// Search and filter validation rules
const validateSearch = () => {
  return [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("minPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Minimum price must be non-negative"),
    query("maxPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Maximum price must be non-negative"),
    query("minRating")
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage("Minimum rating must be between 0 and 5"),
    query("sortBy")
      .optional()
      .isIn(["price_asc", "price_desc", "rating", "newest", "popular", "name"])
      .withMessage("Invalid sort option"),
  ];
};

// Cart validation rules
const validateCartItem = () => {
  return [
    body("quantity")
      .isInt({ min: 1, max: 100 })
      .withMessage("Quantity must be between 1 and 100"),
  ];
};

// Order validation rules
const validateOrder = () => {
  return [
    body("shippingAddress")
      .isObject()
      .withMessage("Shipping address is required"),
    body("shippingAddress.name")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Shipping address name is required"),
    body("shippingAddress.street")
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage("Street address is required"),
    body("shippingAddress.city")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("City is required"),
    body("shippingAddress.state")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("State is required"),
    body("shippingAddress.country")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Country is required"),
    body("shippingAddress.postalCode")
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage("Postal code is required"),
    body("paymentMethod")
      .isIn(["stripe", "paypal", "cash_on_delivery"])
      .withMessage("Invalid payment method"),
  ];
};

// Notification validation rules
const validateNotification = () => {
  return [
    body("title")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Title must be between 1 and 100 characters"),
    body("message")
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage("Message must be between 1 and 500 characters"),
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
    body("priority")
      .optional()
      .isIn(["low", "medium", "high", "urgent"])
      .withMessage("Invalid priority level"),
  ];
};

// File upload validation
const validateFileUpload = (fieldName, allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.files || !req.files[fieldName]) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} is required`,
      });
    }

    const file = req.files[fieldName];
    
    // Check file size
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File size cannot exceed ${maxSize / (1024 * 1024)}MB`,
      });
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
      });
    }

    next();
  };
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Remove any HTML tags from string inputs
  const sanitizeString = (str) => {
    if (typeof str === "string") {
      return str.replace(/<[^>]*>/g, "").trim();
    }
    return str;
  };

  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === "string") {
        obj[key] = sanitizeString(obj[key]);
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }

  if (req.query) {
    sanitizeObject(req.query);
  }

  next();
};

module.exports = {
  validateObjectId,
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateProduct,
  validateReview,
  validateAddress,
  validateSearch,
  validateCartItem,
  validateOrder,
  validateNotification,
  validateFileUpload,
  sanitizeInput,
};

