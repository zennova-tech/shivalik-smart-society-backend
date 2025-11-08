// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { required } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication APIs
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "zennova@gmail.com"
 *               password:
 *                 type: string
 *                 example: "Test@123"
 */
// POST /api/v1/auth/login
router.post("/login", authController.loginWithPassword);

/**
 * @swagger
 * /auth/accept-invite:
 *   post:
 *     summary: Accept invite and set password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: "inviteToken123"
 *               password:
 *                 type: string
 *                 example: "Strong@123"
 */
// POST /api/v1/auth/accept-invite
router.post("/accept-invite", authController.acceptInvite);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password for logged-in user
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "Test@123"
 *               newPassword:
 *                 type: string
 *                 example: "NewStrong@123"
 */
// new: change password
router.post("/change-password", required, authController.changePassword);

module.exports = router;
