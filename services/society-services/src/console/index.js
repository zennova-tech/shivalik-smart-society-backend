// src/console/index.js
const mongoose = require("mongoose");
const { connect } = require("../config/db.config");
const logger = require("../utils/logger");

async function runSeeds() {
  try {
    await connect();
    console.log("🚀 Running seeders...\n");

    const seedAdmin = require("./seeds/admin.seed");
    const seedExample = require("./seeds/example.seed");

    if (typeof seedAdmin === "function") await seedAdmin();
    if (typeof seedExample === "function") await seedExample();

    console.log("\n🎉 Seeds completed");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    logger.error("Error running seeds", err);
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

if (require.main === module) runSeeds();
module.exports = { runSeeds };
