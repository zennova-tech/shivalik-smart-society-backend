// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { required } = require("../middleware/auth");
const {
  loginValidator,
  acceptInviteValidator,
  changePasswordValidator,
} = require("../validations/auth.validators");

// POST /api/v1/auth/login
router.post("/login", loginValidator, authController.loginWithPassword);

// POST /api/v1/auth/accept-invite
router.post("/accept-invite", acceptInviteValidator, authController.acceptInvite);

// new: change password
router.post("/change-password", required, changePasswordValidator, authController.changePassword);

module.exports = router;
