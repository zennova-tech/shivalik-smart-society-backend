// src/routes/society.routes.js
const express = require("express");
const router = express.Router();
const societyController = require("../controllers/society.controller");
const { required } = require("../middleware/auth"); // verifies JWT
const societyListCtrl = require("../controllers/society.list.controller");
const { createSocietyValidator } = require("../validations/society.validators");

router.get("/list", societyListCtrl.getSocietiesList);
router.post("/", societyController.createSociety);
router.get("/:id/details", societyController.getSocietyDetails);

router.delete("/:id", societyController.remove);

// other society routes...

module.exports = router;
