// src/validations/userRegistration.validators.js
const { body, query, param } = require("express-validator");

exports.getSocietiesValidator = [
  query("search").optional().isString().trim(),
];

exports.getSocietyBlocksValidator = [
  param("societyId")
    .isMongoId()
    .withMessage("Invalid society ID"),
];

exports.getBlockUnitsValidator = [
  param("societyId")
    .isMongoId()
    .withMessage("Invalid society ID"),
  param("blockId")
    .isMongoId()
    .withMessage("Invalid block ID"),
];

exports.registerUserValidator = [
  body("type")
    .isIn(["Owner", "Tenant"])
    .withMessage("Type must be either Owner or Tenant"),
  body("societyId")
    .isMongoId()
    .withMessage("Invalid society ID"),
  body("blockId")
    .isMongoId()
    .withMessage("Invalid block ID"),
  body("unitId")
    .isMongoId()
    .withMessage("Invalid unit ID"),
  body("firstName")
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name is required and must be between 2 and 50 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Last name must be less than 50 characters"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email address"),
  body("countryCode")
    .optional()
    .isString()
    .trim()
    .withMessage("Invalid country code"),
  body("mobileNumber")
    .notEmpty()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile number must be 10 digits"),
  body("gender")
    .optional()
    .isIn(["Male", "Female", "Other"])
    .withMessage("Invalid gender"),
  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Invalid date of birth format"),
  body("occupation")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Occupation must be less than 100 characters"),
  body("address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address must be less than 500 characters"),
  body("aadharNumber")
    .optional()
    .trim()
    .matches(/^[0-9]{12}$/)
    .withMessage("Aadhar number must be 12 digits"),
  body("panNumber")
    .optional()
    .trim()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage("Invalid PAN number format"),
];

