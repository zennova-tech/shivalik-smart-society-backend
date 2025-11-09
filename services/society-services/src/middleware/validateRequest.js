// src/middleware/validateRequest.js
const { validationResult } = require("express-validator");
const { fail } = require("../utils/response");

exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg).join(", ");
    return fail(res, errorMessages, 422);
  }
  next();
};
