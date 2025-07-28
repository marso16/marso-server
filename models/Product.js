const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      maxlength: [500, "Review comment cannot exceed 500 characters"],
    },
    verified: {
      type: Boolean,
      default: false, // True if user purchased the product
    },
    helpful: {
      type: Number,
      default: 0, // Number of users who found this review helpful
    },
    images: [
      {
        url: String,
        alt: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // e.g., "Size", "Color"
  },
  value: {
    type: String,
    required: true, // e.g., "Large", "Red"
  },
  price: {
    type: Number,
    min: 0, // Additional price for this variant
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  images: [
    {
      url: String,
      alt: String,
    },
  ],
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Product name cannot be more than 100 characters"],
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      maxlength: [2000, "Description cannot be more than 2000 characters"],
    },
    shortDescription: {
      type: String,
      maxlength: [200, "Short description cannot exceed 200 characters"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
      index: true,
    },
    originalPrice: {
      type: Number,
      min: [0, "Original price cannot be negative"],
    },
    costPrice: {
      type: Number,
      min: [0, "Cost price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      enum: ["Electronics", "Books", "Sports", "Toys"],
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      index: true,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: {
          type: String,
          default: "",
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
      index: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
    },
    barcode: {
      type: String,
      sparse: true,
    },
    weight: {
      type: Number,
      min: [0, "Weight cannot be negative"],
    },
    dimensions: {
      length: {
        type: Number,
        min: 0,
      },
      width: {
        type: Number,
        min: 0,
      },
      height: {
        type: Number,
        min: 0,
      },
      unit: {
        type: String,
        enum: ["cm", "in"],
        default: "cm",
      },
    },
    shippingInfo: {
      weight: Number,
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
      },
      freeShipping: {
        type: Boolean,
        default: false,
      },
      shippingCost: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    specifications: {
      type: Map,
      of: String,
    },
    variants: [variantSchema],
    reviews: [reviewSchema],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDigital: {
      type: Boolean,
      default: false,
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    discountStartDate: Date,
    discountEndDate: Date,
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // SEO fields
    metaTitle: {
      type: String,
      maxlength: 60,
    },
    metaDescription: {
      type: String,
      maxlength: 160,
    },
    metaKeywords: [String],

    views: {
      type: Number,
      default: 0,
    },
    purchases: {
      type: Number,
      default: 0,
    },
    wishlistCount: {
      type: Number,
      default: 0,
    },
    // Inventory tracking
    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Product status
    status: {
      type: String,
      enum: ["draft", "active", "inactive", "out_of_stock", "discontinued"],
      default: "active",
      index: true,
    },
    // Related products
    relatedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    // Supplier information
    supplier: {
      name: String,
      contact: String,
      email: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better query performance
productSchema.index({ category: 1, price: 1 });
productSchema.index({ brand: 1, category: 1 });
productSchema.index({ rating: -1, numReviews: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ seller: 1, status: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });

// Text index for search functionality
productSchema.index({
  name: "text",
  description: "text",
  shortDescription: "text",
  category: "text",
  subcategory: "text",
  brand: "text",
  tags: "text",
  "specifications.value": "text",
});

// Virtual for available stock (total stock - reserved stock)
productSchema.virtual("availableStock").get(function () {
  return Math.max(0, this.stock - this.reservedStock);
});

// Virtual for discount amount
productSchema.virtual("discountAmount").get(function () {
  if (this.discount > 0 && this.originalPrice) {
    return this.discountType === "percentage"
      ? (this.originalPrice * this.discount) / 100
      : this.discount;
  }
  return 0;
});

// Virtual for final price after discount
productSchema.virtual("finalPrice").get(function () {
  if (this.discount > 0 && this.originalPrice) {
    const discountAmount = this.discountAmount;
    return Math.max(0, this.originalPrice - discountAmount);
  }
  return this.price;
});

// Virtual for profit margin
productSchema.virtual("profitMargin").get(function () {
  if (this.costPrice && this.price > this.costPrice) {
    return ((this.price - this.costPrice) / this.price) * 100;
  }
  return 0;
});

// Virtual for stock status
productSchema.virtual("stockStatus").get(function () {
  if (this.availableStock === 0) return "out_of_stock";
  if (this.availableStock <= this.lowStockThreshold) return "low_stock";
  return "in_stock";
});

// Pre-save middleware to generate slug
productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

// Calculate average rating
productSchema.methods.calculateAverageRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
  } else {
    const totalRating = this.reviews.reduce(
      (acc, review) => acc + review.rating,
      0
    );
    this.rating = Math.round((totalRating / this.reviews.length) * 10) / 10;
    this.numReviews = this.reviews.length;
  }
};

// Method to check if product is on sale
productSchema.methods.isOnSale = function () {
  if (!this.discount || this.discount === 0) return false;

  const now = new Date();
  if (this.discountStartDate && now < this.discountStartDate) return false;
  if (this.discountEndDate && now > this.discountEndDate) return false;

  return true;
};

// Method to reserve stock
productSchema.methods.reserveStock = function (quantity) {
  if (this.availableStock >= quantity) {
    this.reservedStock += quantity;
    return true;
  }
  return false;
};

// Method to release reserved stock
productSchema.methods.releaseStock = function (quantity) {
  this.reservedStock = Math.max(0, this.reservedStock - quantity);
};

// Method to reduce stock after purchase
productSchema.methods.reduceStock = function (quantity) {
  if (this.stock >= quantity) {
    this.stock -= quantity;
    this.reservedStock = Math.max(0, this.reservedStock - quantity);
    this.purchases += 1;
    return true;
  }
  return false;
};

// Pre-save middleware to calculate rating and update status
productSchema.pre("save", function (next) {
  this.calculateAverageRating();

  // Auto-update status based on stock
  if (this.availableStock === 0 && this.status === "active") {
    this.status = "out_of_stock";
  } else if (this.availableStock > 0 && this.status === "out_of_stock") {
    this.status = "active";
  }

  next();
});

// Static method to find products with low stock
productSchema.statics.findLowStock = function () {
  return this.find({
    $expr: {
      $lte: [{ $subtract: ["$stock", "$reservedStock"] }, "$lowStockThreshold"],
    },
    status: "active",
  });
};

// Static method to find featured products
productSchema.statics.findFeatured = function (limit = 10) {
  return this.find({
    isFeatured: true,
    isActive: true,
    status: "active",
  })
    .populate("seller", "name")
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method for advanced search
productSchema.statics.advancedSearch = function (searchOptions) {
  const {
    query,
    category,
    subcategory,
    brand,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    featured,
    sortBy,
    page = 1,
    limit = 12,
  } = searchOptions;

  let filter = { isActive: true, status: "active" };

  // Text search
  if (query) {
    filter.$text = { $search: query };
  }

  // Category filter
  if (category) filter.category = category;
  if (subcategory) filter.subcategory = subcategory;
  if (brand) filter.brand = new RegExp(brand, "i");

  // Price range
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  // Rating filter
  if (minRating) filter.rating = { $gte: parseFloat(minRating) };

  // Stock filter
  if (inStock) {
    filter.$expr = { $gt: [{ $subtract: ["$stock", "$reservedStock"] }, 0] };
  }

  // Featured filter
  if (featured) filter.isFeatured = true;

  // Sort options
  let sort = {};
  switch (sortBy) {
    case "price_asc":
      sort = { price: 1 };
      break;
    case "price_desc":
      sort = { price: -1 };
      break;
    case "rating":
      sort = { rating: -1, numReviews: -1 };
      break;
    case "newest":
      sort = { createdAt: -1 };
      break;
    case "popular":
      sort = { purchases: -1, views: -1 };
      break;
    case "name":
      sort = { name: 1 };
      break;
    default:
      sort = { createdAt: -1 };
  }

  const skip = (page - 1) * limit;

  return this.find(filter)
    .populate("seller", "name")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select("-reviews");
};

module.exports = mongoose.model("Product", productSchema);
