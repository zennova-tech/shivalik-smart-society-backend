// src/migrations/20251109-seed-superadmin.js
const bcrypt = require("bcryptjs");

module.exports = {
  async up(db, client) {
    const email = "zennova@gmail.com";
    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      console.log("[migration] superadmin already exists:", email);
      return;
    }

    const plain = "Test@123";
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(plain, salt);

    const now = new Date();
    await db.collection("users").insertOne({
      firstName: "Zennova",
      lastName: "Dev",
      email,
      emailVerified: false,
      countryCode: "+91",
      mobileNumber: "9999999999",
      passwordHash: hash,
      role: "superadmin",
      status: "active",
      invited: false,
      isDeleted: false,
      createdBy: null,
      updatedBy: null,
      createdAt: now,
      updatedAt: now,
    });

    console.log("[migration] seeded superadmin:", email);
  },

  async down(db, client) {
    const email = "zennova@gmail.com";
    await db.collection("users").deleteOne({ email });
    console.log("[migration] removed superadmin:", email);
  },
};
