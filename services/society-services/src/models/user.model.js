const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String },

    email: { type: String, required: true, unique: true },
    countryCode: { type: String },
    mobileNumber: { type: String },

    passwordHash: { type: String }, // hashed password (bcrypt or similar)

    // User Role in System
    role: {
      type: String,
      enum: ["admin", "manager", "member", "committeeMember", "employee"],
      default: "member",
    },

    // Reference to which society the user belongs
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society" },

    // Optional linking with Committee or Employee document
    committeeMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommitteeMember",
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    createdAt: { type: Date, default: Date.now },
  },
  { collection: "users" }
);

module.exports = mongoose.model("User", UserSchema);
