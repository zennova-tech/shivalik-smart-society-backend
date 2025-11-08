// src/routes/society.routes.js
const express = require("express");
const router = express.Router();
const societyController = require("../controllers/society.controller");
const { required } = require("../middleware/auth"); // verifies JWT
const authorize = require("../middleware/authorize"); // checks roles array

/**
 * @swagger
 * tags:
 *   name: Society
 *   description: Society Management APIs
 */

/**
 * @swagger
 * /societies:
 *   post:
 *     summary: Create a new society and invite a society manager
 *     tags: [Society]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: string
 *                 example: "6601f45a..."
 *               name:
 *                 type: string
 *                 example: "Shivalik Greens"
 *               territory:
 *                 type: string
 *                 example: "Gujarat"
 *               address:
 *                 type: string
 *                 example: "Sola Road, Ahmedabad"
 *               manager:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                     example: "Zennova"
 *                   lastName:
 *                     type: string
 *                     example: "Dev"
 *                   countryCode:
 *                     type: string
 *                     example: "+91"
 *                   mobileNumber:
 *                     type: string
 *                     example: "9999999999"
 *                   email:
 *                     type: string
 *                     example: "manager@shivalik.com"
 */
// create society (only superadmin or platform-level admin)
router.post(
  "/",
  required,
  authorize(["superadmin", "admin"]), // adjust allowed roles as per your policy
  societyController.createSociety
);

// other society routes...
module.exports = router;
