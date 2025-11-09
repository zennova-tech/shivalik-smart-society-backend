const express = require("express");
const router = express.Router();
const { required } = require("../middleware/auth");
const controller = require("../controllers/service.controller");

// If you have auth middleware, insert it (e.g. auth.required)
router.post("/", required, controller.create); // create
router.get("/", required, controller.list); // list + pagination + search
router.get("/:id", required, controller.getById); // single
router.patch("/:id", required, controller.update); // update partial
router.delete("/:id", required, controller.remove); // soft delete
router.post("/:id/toggle-active", required, controller.toggleActive); // toggle

module.exports = router;
