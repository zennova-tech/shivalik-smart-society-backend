const winston = require("winston");
const { logLevel } = require("../config/env");

const logger = winston.createLogger({
  level: logLevel || "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.simple()),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
