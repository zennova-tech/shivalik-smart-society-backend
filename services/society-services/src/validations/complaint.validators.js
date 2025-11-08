// validators/complaint.validators.js
const { body, param, query } = require("express-validator");

const createComplaintValidators = [
  body("category").notEmpty().withMessage("Category is required").isString(),
  body("location").optional().isString(),
  body("priority").optional().isIn(["low", "medium", "high", "urgent"]),
  body("description").notEmpty().withMessage("Description is required").isLength({ max: 5000 }),
];

const updateComplaintValidators = [
  param("id").isMongoId().withMessage("Invalid complaint id"),
  body("category").optional().isString(),
  body("location").optional().isString(),
  body("priority").optional().isIn(["low", "medium", "high", "urgent"]),
  body("description").optional().isString(),
  body("status").optional().isIn(["open", "in_progress", "resolved", "closed", "archived"]),
  body("assignedTo").optional().isMongoId(),
];

const idParamValidator = [param("id").isMongoId().withMessage("Invalid id")];

const listQueryValidators = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1 }).toInt(),
  query("status").optional().isIn(["open", "in_progress", "resolved", "closed", "archived"]),
  query("priority").optional().isIn(["low", "medium", "high", "urgent"]),
  query("q").optional().isString(),
];

const commentValidators = [
  param("id").isMongoId().withMessage("Invalid complaint id"),
  body("comment").notEmpty().withMessage("Comment is required").isString(),
];

module.exports = {
  createComplaintValidators,
  updateComplaintValidators,
  idParamValidator,
  listQueryValidators,
  commentValidators,
};
