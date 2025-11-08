// src/console/seeds/admin.seed.js
const User = require("../../models/user.model");
// const bcrypt = require('bcrypt'); // uncomment if you want to set a password

async function seedAdmin() {
  const adminEmail = "zennova@gmail.com";

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    console.log(`⚙️  Admin user already exists: ${existing.email}`);
    return;
  }

  // If you want to set a password, enable hashing here:
  // const plainPassword = 'ChangeMe@123';
  // const salt = await bcrypt.genSalt(10);
  // const passwordHash = await bcrypt.hash(plainPassword, salt);

  const adminDoc = {
    firstName: "Zennova",
    lastName: "Dev",
    email: adminEmail,
    countryCode: "+91",
    mobileNumber: "9999999999",
    // passwordHash, // uncomment above if using password
    role: "admin",
    status: "active",
    createdAt: new Date(),
  };

  const admin = await User.create(adminDoc);
  console.log("✅ Admin user created:", admin.email);
}

module.exports = seedAdmin;
