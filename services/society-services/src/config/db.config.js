const mongoose = require("mongoose");
const logger = require("../utils/logger");
const { mongoUri } = require("./env");

async function connect() {
  mongoose.set("strictQuery", false);

  const uri = mongoUri || "mongodb://127.0.0.1:27017/smart-society";
  // redact visible password for logs
  const safeLogUri = uri.replace(/:\/\/.*@/, "://<user>:<redacted>@");

  logger.info("Connecting to MongoDB:", safeLogUri);
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // fail fast if no server
    });
    logger.info("MongoDB connected");
  } catch (err) {
    logger.error(
      "MongoDB connection error",
      err && err.message ? err.message : err
    );
    // exit so you can clearly see failure in logs and debug
    process.exit(1);
  }
}

module.exports = { connect };
