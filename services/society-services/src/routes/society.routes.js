// src/routes/society.routes.js
const express = require("express");
const router = express.Router();
const societyController = require("../controllers/society.controller");
const { required } = require("../middleware/auth"); // verifies JWT
const societyListCtrl = require("../controllers/society.list.controller");
const { createSocietyValidator } = require("../validations/society.validators");

router.get("/list", required, societyListCtrl.getSocietiesList);
router.post("/", required, societyController.createSociety);
router.get("/:id/details", required, societyController.getSocietyDetails);

router.delete("/:id", required, societyController.remove);

// other society routes...

module.exports = router;
