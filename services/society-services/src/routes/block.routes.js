// routes/block.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/block.controller");
// Create a block
router.post("/", controller.create);

// List blocks (pagination + filter)
router.get("/", controller.list);

// Get by id
router.get("/:id", controller.getById);

// Update
router.put("/:id", controller.update);

// Delete (soft/hard)
router.delete("/:id", controller.remove);

module.exports = router;
