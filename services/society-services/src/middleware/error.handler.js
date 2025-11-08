// src/middleware/errorHandler.js
const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
  logger.error(err.stack || err.message || err);

  return res.status(err.status || 500).json({
    status: false,
    message: err.message || "Internal Server Error",
    data: null,
  });
};
