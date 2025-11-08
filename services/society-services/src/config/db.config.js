// src/config/db.config.js
const mongoose = require("mongoose");
const env = require("./env");
const logger = require("../utils/logger");

let isConnected = false;

async function connect() {
  if (isConnected) return mongoose.connection;

  mongoose.set("strictQuery", false);

  try {
    await mongoose.connect(env.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    logger.info("MongoDB connected:", env.mongoUri);
    return mongoose.connection;
  } catch (err) {
    logger.error("MongoDB connection error", err);
    throw err;
  }
}

module.exports = { connect };
