const express = require("express");
const { body, query } = require("express-validator");
const productController = require("../controllers/products");
const { protect, admin, optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
    query("minPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Min price must be non-negative"),
    query("maxPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Max price must be non-negative"),
  ],
  productController.getAllProducts
);

router.get("/featured/list", productController.getFeaturedProducts);

router.get("/:id", optionalAuth, productController.getOneProduct);

router.post(
  "/",
  protect,
  admin,
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Product name must be between 2 and 100 characters"),
    body("description")
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage("Description must be between 10 and 2000 characters"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("category").notEmpty().withMessage("Category is required"),
    body("stock")
      .isInt({ min: 0 })
      .withMessage("Stock must be a non-negative integer"),
  ],
  productController.createProduct
);

router.put(
  "/:id",
  protect,
  admin,
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Product name must be between 2 and 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage("Description must be between 10 and 2000 characters"),
    body("price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("stock")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Stock must be a non-negative integer"),
  ],
  productController.updateProduct
);

router.delete("/:id", protect, admin, productController.deleteOneProduct);

router.post(
  "/:id/reviews",
  protect,
  [
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment")
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage("Comment must be between 5 and 500 characters"),
  ],
  productController.addProductReview
);

router.delete("/", protect, admin, productController.deleteAllProducts);

module.exports = router;
