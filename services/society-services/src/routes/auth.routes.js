// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { required } = require("../middleware/auth");

// POST /api/v1/auth/login
router.post("/login", authController.loginWithPassword);

// POST /api/v1/auth/accept-invite
router.post("/accept-invite", authController.acceptInvite);

// new: change password
router.post("/change-password", required, authController.changePassword);

module.exports = router;
