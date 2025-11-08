const { body } = require("express-validator");

exports.createSocietyValidator = [
  body("name").exists().withMessage("name required").isLength({ min: 2 }),
  body("address").optional().isString(),
];
