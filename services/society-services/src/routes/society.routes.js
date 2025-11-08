const express = require("express");
const router = express.Router();
const controller = require("../controllers/society.controller");
const { createSocietyValidator } = require("../validations/society.validation");
const auth = require("../middleware/auth");

router.get("/", controller.list);
router.post("/", auth.optional, createSocietyValidator, controller.create);
router.get("/:id", controller.get);

module.exports = router;
