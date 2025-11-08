// routes/floor.routes.js
const express = require("express");
const router = express.Router();

const controller = require("../controllers/floor.controller");

// Single floor CRUD
router.post("/", controller.create);

router.get("/", controller.list);

router.get("/:id", controller.getById);

router.put(
  "/:id",
  controller.update
);

router.delete(
  "/:id",
  controller.remove
);

// Batch create endpoint (create multiple floors in a block by range)
router.post(
  "/batch",
  controller.batchCreate
);

module.exports = router;
