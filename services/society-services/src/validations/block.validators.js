// src/validators/block.validators.js
const { body, param, query } = require("express-validator");

// ✅ Create Block Validator
exports.createBlockValidator = [
  body("name")
    .notEmpty()
    .withMessage("Block name is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Block name must be between 1 and 100 characters"),

  body("building")
    .notEmpty()
    .withMessage("Building ID is required")
    .isMongoId()
    .withMessage("Invalid building ID format"),

  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either 'active' or 'inactive'"),
];

// ✅ Update Block Validator
exports.updateBlockValidator = [
  param("id").isMongoId().withMessage("Invalid Block ID"),

  body("name")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Block name must be between 1 and 100 characters"),

  body("building").optional().isMongoId().withMessage("Invalid building ID format"),

  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either 'active' or 'inactive'"),
];

// ✅ Query Validator (for list)
exports.listBlockValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer").toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage("Limit must be between 1 and 500")
    .toInt(),
  query("q").optional().isString().withMessage("Search query must be a string"),
  query("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either 'active' or 'inactive'"),
  query("building").optional().isMongoId().withMessage("Invalid building ID format"),
];

// ✅ Delete Block Validator
exports.deleteBlockValidator = [param("id").isMongoId().withMessage("Invalid Block ID")];
