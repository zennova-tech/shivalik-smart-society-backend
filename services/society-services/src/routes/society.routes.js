// src/routes/society.routes.js
const express = require("express");
const router = express.Router();
const societyController = require("../controllers/society.controller");
const { required } = require("../middleware/auth"); // verifies JWT

// create society (only superadmin or platform-level admin)
router.post("/", required, societyController.createSociety);

// other society routes...
module.exports = router;
