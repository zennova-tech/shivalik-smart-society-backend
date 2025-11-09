const express = require("express");
const router = express.Router();
const controller = require("../controllers/building.controller");
const auth = require("../middleware/auth");

router.get("/", controller.list);
// router.post("/", auth.optional, controller.create);
router.get("/:id", controller.getById);
router.put("/:id", controller.update);

module.exports = router;
