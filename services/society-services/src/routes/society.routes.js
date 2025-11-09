// src/routes/society.routes.js
const express = require("express");
const router = express.Router();
const societyController = require("../controllers/society.controller");
const { required } = require("../middleware/auth"); // verifies JWT
const societyListCtrl = require("../controllers/society.list.controller");

// create society (only superadmin or platform-level admin)
router.post("/", required, societyController.createSociety);

router.get("/list", required, societyListCtrl.getSocietiesList);

// other society routes...
module.exports = router;
