// routes/complaint.routes.js
const express = require("express");
const router = express.Router();

const controller = require("../controllers/complaint.controller");
const validators = require("../validations/complaint.validators");
const { upload } = require("../middleware/uploadComplaints");

// create: accept multiple images and optional single audio
const filesFields = upload.fields([
  { name: "images", maxCount: 10 },
  { name: "audio", maxCount: 1 },
]);

router.post("/", filesFields, validators.createComplaintValidators, controller.create);

router.get("/", validators.listQueryValidators, controller.list);
router.get("/:id", validators.idParamValidator, controller.getById);

router.put("/:id", validators.updateComplaintValidators, controller.update);

// append files to complaint
router.post("/:id/files", filesFields, validators.idParamValidator, controller.appendFiles);

// add comment
router.post("/:id/comments", validators.commentValidators, controller.addComment);

router.delete("/:id", validators.idParamValidator, controller.remove);

module.exports = router;
