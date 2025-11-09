// src/validators/auth.validators.js
const { body } = require("express-validator");

// Login validator
exports.loginValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

// Accept invite validator
exports.acceptInviteValidator = [
  body("token").notEmpty().withMessage("Invite token is required"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  // body("confirmPassword")
  //   .notEmpty()
  //   .withMessage("Confirm password is required")
  //   .custom((value, { req }) => {
  //     if (value !== req.body.password) {
  //       throw new Error("Passwords do not match");
  //     }
  //     return true;
  //   }),
];

// Change password validator
exports.changePasswordValidator = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
  // body("confirmPassword")
  //   .notEmpty()
  //   .withMessage("Confirm password is required")
  //   .custom((value, { req }) => {
  //     if (value !== req.body.newPassword) {
  //       throw new Error("New password and confirmation do not match");
  //     }
  //     return true;
  //   }),
];
