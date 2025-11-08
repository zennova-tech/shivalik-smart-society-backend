// src/console/index.js
const mongoose = require("mongoose");
const { connect } = require("../config/db.config");
const logger = require("../utils/logger");

function normalizeExport(mod) {
  if (!mod) return null;
  if (typeof mod === "function") return mod;
  if (mod && typeof mod.default === "function") return mod.default;
  // if module exported named function like module.exports = { seedAdmin }
  if (mod && typeof mod.seedAdmin === "function") return mod.seedAdmin;
  if (mod && typeof mod.seed === "function") return mod.seed;
  if (typeof mod === "object") {
    for (const k of Object.keys(mod)) {
      if (typeof mod[k] === "function") return mod[k];
    }
  }
  return null;
}

async function runSeeds() {
  try {
    await connect();
    console.log("🚀 Running all seeders...\n");

    // require seed modules (add new seeds here)
    const adminMod = require("./seeds/admin.seed");

    const seedAdmin = normalizeExport(adminMod);

    if (!seedAdmin) throw new Error("seedAdmin is not a function or export not found");

    // run in sequence
    await seedAdmin();

    console.log("\n🎉 All seeds completed successfully!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error("❌ Error running seeds:", error && error.stack ? error.stack : error);
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  }
}

if (require.main === module) {
  runSeeds();
}

module.exports = { runSeeds };
