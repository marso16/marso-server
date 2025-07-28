const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        notes: {
          type: String,
          maxlength: 200,
        },
      },
    ],
    name: {
      type: String,
      default: "My Wishlist",
      maxlength: 50,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user and product
wishlistSchema.index({ user: 1, "products.product": 1 });

// Method to add product to wishlist
wishlistSchema.methods.addProduct = function (productId, notes = "") {
  const existingProduct = this.products.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (existingProduct) {
    return false; // Product already in wishlist
  }

  this.products.push({
    product: productId,
    notes,
  });

  return true;
};

// Method to remove product from wishlist
wishlistSchema.methods.removeProduct = function (productId) {
  const initialLength = this.products.length;
  this.products = this.products.filter(
    (item) => item.product.toString() !== productId.toString()
  );

  return this.products.length < initialLength;
};

// Method to check if product is in wishlist
wishlistSchema.methods.hasProduct = function (productId) {
  return this.products.some(
    (item) => item.product.toString() === productId.toString()
  );
};

// Method to generate share token
wishlistSchema.methods.generateShareToken = function () {
  const crypto = require("crypto");
  this.shareToken = crypto.randomBytes(16).toString("hex");
  return this.shareToken;
};

// Static method to find user's wishlist
wishlistSchema.statics.findByUser = function (userId) {
  return this.findOne({ user: userId }).populate({
    path: "products.product",
    select: "name price images rating numReviews isActive",
    match: { isActive: true },
  });
};

// Static method to find public wishlist by share token
wishlistSchema.statics.findByShareToken = function (shareToken) {
  return this.findOne({ shareToken, isPublic: true }).populate([
    {
      path: "user",
      select: "name",
    },
    {
      path: "products.product",
      select: "name price images rating numReviews isActive",
      match: { isActive: true },
    },
  ]);
};

module.exports = mongoose.model("Wishlist", wishlistSchema);
