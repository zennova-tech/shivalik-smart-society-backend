// validators/committeeMember.validators.js
const { body, param, query } = require("express-validator");

const createCommitteeValidators = [
  body("firstName").notEmpty().withMessage("First name is required").isLength({ max: 150 }),
  body("lastName").optional().isLength({ max: 150 }),
  body("countryCode").optional().isString().trim(),
  body("mobileNumber")
    .notEmpty()
    .withMessage("Mobile number is required")
    .isLength({ min: 6, max: 20 }),
  body("email").notEmpty().withMessage("Email is required").isEmail().normalizeEmail(),
  body("memberType").optional().isIn(["chairman", "secretary", "treasurer", "member", "other"]),
  body("society").optional().isMongoId(),
  body("building").optional().isMongoId(),
  body("block").optional().isMongoId(),
  body("status").optional().isIn(["active", "inactive", "resigned", "archived"]),
];

const updateCommitteeValidators = [
  param("id").isMongoId().withMessage("Invalid id"),
  body("firstName").optional().notEmpty().isLength({ max: 150 }),
  body("lastName").optional().isLength({ max: 150 }),
  body("countryCode").optional().isString().trim(),
  body("mobileNumber").optional().isLength({ min: 6, max: 20 }),
  body("email").optional().isEmail().normalizeEmail(),
  body("memberType").optional().isIn(["chairman", "secretary", "treasurer", "member", "other"]),
  body("society").optional().isMongoId(),
  body("building").optional().isMongoId(),
  body("block").optional().isMongoId(),
  body("status").optional().isIn(["active", "inactive", "resigned", "archived"]),
];

const idParamValidator = [param("id").isMongoId().withMessage("Invalid id")];

const listQueryValidators = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1 }).toInt(),
  query("q").optional().isString(),
  query("society").optional().isMongoId(),
  query("status").optional().isIn(["active", "inactive", "resigned", "archived"]),
  query("memberType").optional().isIn(["chairman", "secretary", "treasurer", "member", "other"]),
];

module.exports = {
  createCommitteeValidators,
  updateCommitteeValidators,
  idParamValidator,
  listQueryValidators,
};
