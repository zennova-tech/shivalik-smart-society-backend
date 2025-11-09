// routes/employee.routes.js
const express = require("express");
const router = express.Router();

const controller = require("../controllers/employee.controller");
const { upload } = require("../middleware/upload");

// file fields accepted: idProof (single), policeVerification (single)
const fileFields = upload.fields([
  { name: "idProof", maxCount: 1 },
  { name: "policeVerification", maxCount: 1 },
]);

// Create - multipart/form-data (files optional)
router.post("/", fileFields, controller.create);

// List (JSON)
router.get("/", controller.list);

// Get by id
router.get("/:id", controller.getById);

// Update (multipart allowed)
router.put("/:id", fileFields, controller.update);

// Delete
router.delete("/:id", controller.remove);

module.exports = router;
