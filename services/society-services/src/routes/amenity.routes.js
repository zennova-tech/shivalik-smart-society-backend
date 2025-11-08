// routes/amenity.routes.js
const express = require("express");
const router = express.Router();

const controller = require("../controllers/amenity.controller");

// CRUD
router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.getById);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

// Slots management
router.post("/:id/slots", controller.addSlot);
router.delete("/:id/slots/:slotId", controller.removeSlot);

module.exports = router;
