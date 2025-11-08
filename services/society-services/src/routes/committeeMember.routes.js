// routes/committeeMember.routes.js
const express = require("express");
const router = express.Router();

const controller = require("../controllers/committeeMember.controller");
const validators = require("../validations/committeeMember.validators");

router.post("/", validators.createCommitteeValidators, controller.create);
router.get("/", validators.listQueryValidators, controller.list);
router.get("/:id", validators.idParamValidator, controller.getById);
router.put("/:id", validators.updateCommitteeValidators, controller.update);
router.delete("/:id", validators.idParamValidator, controller.remove);

module.exports = router;
