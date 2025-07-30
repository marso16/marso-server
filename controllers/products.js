const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Product = require("../models/Product");
const { protect, admin, optionalAuth } = require("../middleware/auth");

const getAllProducts = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isActive: true };

    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice)
        filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice)
        filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Brand filter
    if (req.query.brand) {
      filter.brand = new RegExp(req.query.brand, "i");
    }

    // Search filter
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Rating filter
    if (req.query.minRating) {
      filter.rating = { $gte: parseFloat(req.query.minRating) };
    }

    // Featured filter
    if (req.query.featured === "true") {
      filter.isFeatured = true;
    }

    // Build sort object
    let sort = {};
    switch (req.query.sortBy) {
      case "price_asc":
        sort = { price: 1 };
        break;
      case "price_desc":
        sort = { price: -1 };
        break;
      case "rating":
        sort = { rating: -1 };
        break;
      case "newest":
        sort = { createdAt: -1 };
        break;
      case "name":
        sort = { name: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // Execute query
    const products = await Product.find(filter)
      .populate("seller", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select("-reviews");

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    // Get categories for filters
    const categories = await Product.distinct("category", { isActive: true });
    const brands = await Product.distinct("brand", { isActive: true });

    res.json({
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      filters: {
        categories,
        brands,
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ message: "Server error fetching products" });
  }
};

const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      isFeatured: true,
    })
      .populate("seller", "name")
      .sort({ createdAt: -1 })
      .limit(8)
      .select("-reviews");

    res.json(products);
  } catch (error) {
    console.error("Get featured products error:", error);
    res
      .status(500)
      .json({ message: "Server error fetching featured products" });
  }
};

const getOneProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("seller", "name email")
      .populate("reviews.user", "name avatar");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.isActive) {
      return res.status(404).json({ message: "Product not available" });
    }

    res.json(product);
  } catch (error) {
    console.error("Get product error:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(500).json({ message: "Server error fetching product" });
  }
};

const createProduct = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const productData = {
      ...req.body,
      seller: req.user._id,
    };

    const product = await Product.create(productData);

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ message: "Server error creating product" });
  }
};

const updateProduct = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update product
    Object.assign(product, req.body);
    await product.save();

    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(500).json({ message: "Server error updating product" });
  }
};

const deleteOneProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Soft delete - mark as inactive
    product.isActive = false;
    await product.save();

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(500).json({ message: "Server error deleting product" });
  }
};

const addProductReview = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already reviewed this product
    const existingReview = product.reviews.find(
      (review) => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({ message: "Product already reviewed" });
    }

    // Add review
    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);
    await product.save();

    res.status(201).json({
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    console.error("Add review error:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(500).json({ error: error.message });
  }
};

const deleteAllProducts = async (req, res) => {
  try {
    const result = await Product.deleteMany({});
    res.status(200).json({
      message: "All products deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting all products:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getFeaturedProducts,
  getOneProduct,
  createProduct,
  updateProduct,
  deleteOneProduct,
  deleteAllProducts,
  addProductReview,
};
