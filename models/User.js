const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const addressSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["home", "work", "other"],
    default: "home",
  },
  name: {
    type: String,
    required: true,
    maxlength: 50,
  },
  street: {
    type: String,
    required: true,
    maxlength: 100,
  },
  city: {
    type: String,
    required: true,
    maxlength: 50,
  },
  state: {
    type: String,
    required: true,
    maxlength: 50,
  },
  country: {
    type: String,
    required: true,
    maxlength: 50,
  },
  postalCode: {
    type: String,
    required: true,
    maxlength: 20,
  },
  phone: {
    type: String,
    maxlength: 20,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
});

const preferencesSchema = new mongoose.Schema({
  emailNotifications: {
    orderUpdates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false },
    productRecommendations: { type: Boolean, default: true },
    priceAlerts: { type: Boolean, default: false },
  },
  pushNotifications: {
    orderUpdates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false },
    newProducts: { type: Boolean, default: false },
  },
  privacy: {
    showProfile: { type: Boolean, default: false },
    showWishlist: { type: Boolean, default: false },
    showReviews: { type: Boolean, default: true },
  },
  language: {
    type: String,
    default: "en",
    enum: ["en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko"],
  },
  currency: {
    type: String,
    default: "USD",
    enum: ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CNY"],
  },
  theme: {
    type: String,
    default: "light",
    enum: ["light", "dark", "auto"],
  },
});

const loyaltySchema = new mongoose.Schema({
  points: {
    type: Number,
    default: 0,
    min: 0,
  },
  tier: {
    type: String,
    enum: ["bronze", "silver", "gold", "platinum"],
    default: "bronze",
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0,
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin", "moderator", "seller"],
      default: "user",
      index: true,
    },
    avatar: {
      url: {
        type: String,
        default: "",
      },
      publicId: String, // For Cloudinary or similar services
    },
    addresses: [addressSchema],
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
    },
    // Account status and verification
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    phoneVerificationCode: String,
    phoneVerificationExpires: Date,

    // Password reset
    passwordResetToken: String,
    passwordResetExpires: Date,

    // OTP for registration
    otp: String,
    otpExpires: Date,
    isOtpVerified: {
      type: Boolean,
      default: false,
    },

    // Two-factor authentication
    twoFactorSecret: String,
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorBackupCodes: [String],

    // Login tracking
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,

    // User preferences
    preferences: {
      type: preferencesSchema,
      default: () => ({}),
    },

    // Loyalty program
    loyalty: {
      type: loyaltySchema,
      default: () => ({}),
    },

    // Social login
    socialLogins: {
      google: {
        id: String,
        email: String,
      },
      facebook: {
        id: String,
        email: String,
      },
      apple: {
        id: String,
        email: String,
      },
    },

    totalOrders: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    averageOrderValue: {
      type: Number,
      default: 0,
    },
    lastOrderDate: Date,

    // Referral system
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    referralCount: {
      type: Number,
      default: 0,
    },

    // Device and session tracking
    devices: [
      {
        deviceId: String,
        deviceType: {
          type: String,
          enum: ["mobile", "tablet", "desktop"],
        },
        browser: String,
        os: String,
        lastUsed: Date,
        pushToken: String, // For push notifications
      },
    ],

    // Seller-specific fields (if role is seller)
    sellerInfo: {
      businessName: String,
      businessType: {
        type: String,
        enum: ["individual", "business", "corporation"],
      },
      taxId: String,
      bankAccount: {
        accountNumber: String,
        routingNumber: String,
        accountHolderName: String,
      },
      commission: {
        type: Number,
        min: 0,
        max: 100,
        default: 10, // Percentage
      },
      isApproved: {
        type: Boolean,
        default: false,
      },
      approvedAt: Date,
      documents: [
        {
          type: String,
          url: String,
          verified: Boolean,
          uploadedAt: Date,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });
// userSchema.index({ referralCode: 1 });
userSchema.index({ "loyalty.tier": 1 });
userSchema.index({ createdAt: -1 });

// Virtual for account lock status
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for full name with title
userSchema.virtual("displayName").get(function () {
  return this.name;
});

// Virtual for default address
userSchema.virtual("defaultAddress").get(function () {
  return this.addresses.find((addr) => addr.isDefault) || this.addresses[0];
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate referral code
userSchema.pre("save", function (next) {
  if (this.isNew && !this.referralCode) {
    this.referralCode = this.generateReferralCode();
  }
  next();
});

// Pre-save middleware to update loyalty tier
userSchema.pre("save", function (next) {
  if (this.isModified("loyalty.totalSpent")) {
    this.updateLoyaltyTier();
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate referral code
userSchema.methods.generateReferralCode = function () {
  const prefix = this.name.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${random}`;
};

// Method to update loyalty tier
userSchema.methods.updateLoyaltyTier = function () {
  const totalSpent = this.loyalty.totalSpent;

  if (totalSpent >= 10000) {
    this.loyalty.tier = "platinum";
  } else if (totalSpent >= 5000) {
    this.loyalty.tier = "gold";
  } else if (totalSpent >= 1000) {
    this.loyalty.tier = "silver";
  } else {
    this.loyalty.tier = "bronze";
  }
};

// Method to add loyalty points
userSchema.methods.addLoyaltyPoints = function (points) {
  this.loyalty.points += points;
  return this.loyalty.points;
};

// Method to redeem loyalty points
userSchema.methods.redeemLoyaltyPoints = function (points) {
  if (this.loyalty.points >= points) {
    this.loyalty.points -= points;
    return true;
  }
  return false;
};

// Method to add address
userSchema.methods.addAddress = function (addressData) {
  // If this is the first address or marked as default, make it default
  if (this.addresses.length === 0 || addressData.isDefault) {
    // Remove default from other addresses
    this.addresses.forEach((addr) => (addr.isDefault = false));
    addressData.isDefault = true;
  }

  this.addresses.push(addressData);
  return this.addresses[this.addresses.length - 1];
};

// Method to update address
userSchema.methods.updateAddress = function (addressId, updateData) {
  const address = this.addresses.id(addressId);
  if (!address) return null;

  // If setting as default, remove default from others
  if (updateData.isDefault) {
    this.addresses.forEach((addr) => (addr.isDefault = false));
  }

  Object.assign(address, updateData);
  return address;
};

// Method to remove address
userSchema.methods.removeAddress = function (addressId) {
  const address = this.addresses.id(addressId);
  if (!address) return false;

  const wasDefault = address.isDefault;
  address.remove();

  // If removed address was default, make first address default
  if (wasDefault && this.addresses.length > 0) {
    this.addresses[0].isDefault = true;
  }

  return true;
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Method to generate OTP
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  
  this.otp = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

  this.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  this.isOtpVerified = false;

  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = function (candidateOTP) {
  if (!this.otp || !this.otpExpires) {
    return false;
  }

  if (this.otpExpires < Date.now()) {
    return false;
  }

  const hashedOTP = crypto
    .createHash("sha256")
    .update(candidateOTP)
    .digest("hex");

  return this.otp === hashedOTP;
};

// Method to handle login attempts
userSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }

  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  });
};

// Method to update order statistics
userSchema.methods.updateOrderStats = function (orderValue) {
  this.totalOrders += 1;
  this.totalSpent += orderValue;
  this.averageOrderValue = this.totalSpent / this.totalOrders;
  this.lastOrderDate = new Date();

  // Update loyalty points (1 point per dollar spent)
  this.addLoyaltyPoints(Math.floor(orderValue));

  // Update loyalty total spent
  this.loyalty.totalSpent += orderValue;
};

// Static method to find users by referral code
userSchema.statics.findByReferralCode = function (referralCode) {
  return this.findOne({ referralCode, isActive: true });
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
  delete userObject.twoFactorSecret;
  delete userObject.twoFactorBackupCodes;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;

  return userObject;
};

module.exports = mongoose.model("User", userSchema);
