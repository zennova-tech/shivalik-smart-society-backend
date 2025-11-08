// src/console/seeds/admin.seed.js
const User = require("../../models/user.model");
const bcrypt = require("bcryptjs");

async function seedAdmin() {
  const adminEmail = "zennova@gmail.com";
  const existing = await User.findOne({ email: adminEmail.toLowerCase() });
  if (existing) {
    console.log(`⚙️  Admin user already exists: ${existing.email}`);
    return;
  }

  const plain = "Test@123";
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(plain, salt);

  const adminDoc = {
    firstName: "Zennova",
    lastName: "Dev",
    email: adminEmail.toLowerCase(),
    countryCode: "+91",
    mobileNumber: "9999999999",
    passwordHash,
    roles: ["superadmin", "admin"],
    status: "active",
    invited: false,
    isDeleted: false,
  };

  const admin = await User.create(adminDoc);
  console.log("✅ Admin user created:", admin.email);
  console.log("ℹ️  Default password for this superadmin is:", plain);
  console.log("⚠️  Change the password immediately in production.");
}

module.exports = seedAdmin;
