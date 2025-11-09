// src/validators/society.validators.js
const { body } = require("express-validator");

exports.createSocietyValidator = [
  body("projectId")
    .notEmpty()
    .withMessage("Project ID is required")
    .isMongoId()
    .withMessage("Invalid Project ID format"),

  body("name")
    .notEmpty()
    .withMessage("Society name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Society name must be between 2 and 100 characters"),

  body("territory").notEmpty().withMessage("Territory is required").isString().trim(),

  body("address").notEmpty().withMessage("Address is required").isString().trim(),

  body("manager")
    .notEmpty()
    .withMessage("Manager ID is required")
    .isMongoId()
    .withMessage("Invalid Manager ID format"),
];
