// routes/amenity.routes.js
const express = require("express");
const router = express.Router();

const controller = require("../controllers/amenity.controller");
const { required } = require("../middleware/auth");
const {
  createAmenityValidator,
  updateAmenityValidator,
  addSlotValidator,
  removeSlotValidator,
} = require("../validations/amenity.validators");

// CRUD
router.post("/", controller.create);
router.get("/", required, controller.list);
router.get("/:id", required, controller.getById);
router.put("/:id", required, controller.update);
router.delete("/:id", required, controller.remove);

// Slots management
router.post("/:id/slots", required, controller.addSlot);
router.delete("/:id/slots/:slotId", required, controller.removeSlot);

module.exports = router;
