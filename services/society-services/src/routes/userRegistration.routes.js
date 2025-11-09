// src/routes/userRegistration.routes.js
const express = require("express");
const router = express.Router();
const userRegistrationController = require("../controllers/userRegistration.controller");
const {
  getSocietiesValidator,
  getSocietyBlocksValidator,
  getBlockUnitsValidator,
  registerUserValidator,
} = require("../validations/userRegistration.validators");
const { validateRequest } = require("../middleware/validateRequest");
const { upload } = require("../middleware/uploadRegistration");

// Public routes - no authentication required

// GET /api/v1/user/register/societies
// Get list of societies for registration
router.get(
  "/societies",
  getSocietiesValidator,
  validateRequest,
  userRegistrationController.getSocieties
);

// GET /api/v1/user/register/societies/:societyId/blocks
// Get blocks for a society
router.get(
  "/societies/:societyId/blocks",
  getSocietyBlocksValidator,
  validateRequest,
  userRegistrationController.getSocietyBlocks
);

// GET /api/v1/user/register/societies/:societyId/blocks/:blockId/units
// Get units for a block
router.get(
  "/societies/:societyId/blocks/:blockId/units",
  getBlockUnitsValidator,
  validateRequest,
  userRegistrationController.getBlockUnits
);

// POST /api/v1/user/register
// Register a new user (Owner/Tenant)
// Multer middleware handles file uploads (optional - works with or without files)
router.post(
  "/",
  (req, res, next) => {
    // Only use multer if Content-Type is multipart/form-data
    if (req.headers["content-type"] && req.headers["content-type"].includes("multipart/form-data")) {
      return upload.fields([
        { name: "profilePicture", maxCount: 1 },
        { name: "ownershipProof", maxCount: 1 },
      ])(req, res, next);
    }
    next();
  },
  registerUserValidator,
  validateRequest,
  userRegistrationController.registerUser
);

module.exports = router;

