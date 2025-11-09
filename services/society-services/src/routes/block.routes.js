// routes/block.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/block.controller");
const {
  createBlockValidator,
  listBlockValidator,
  updateBlockValidator,
  deleteBlockValidator,
} = require("../validations/block.validators");
const { validateRequest } = require("../middleware/validateRequest");
// Create a block
router.post("/", createBlockValidator, validateRequest, controller.create);

// List blocks (pagination + filter)
router.get("/", listBlockValidator, validateRequest, controller.list);

// Get by id
router.get("/:id", controller.getById);

// Update
router.put("/:id", updateBlockValidator, validateRequest, controller.update);

// Delete (soft/hard)
router.delete("/:id", deleteBlockValidator, validateRequest, controller.remove);

module.exports = router;
