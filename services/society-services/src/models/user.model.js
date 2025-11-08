// src/models/user.model.js
const mongoose = require("mongoose");

const VALID_ROLES = ["superadmin", "admin", "manager", "member", "committeeMember", "employee"];

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, default: "" },

    email: { type: String, required: true, unique: true, index: true },
    countryCode: { type: String, default: "+91" },
    mobileNumber: { type: String, index: true, default: null },

    // passwordHash is required for email/password login users (superadmin/manager)
    passwordHash: { type: String, default: null },

    // multiple roles per user
    roles: {
      type: [{ type: String, enum: VALID_ROLES }],
      default: ["member"],
      index: true,
    },

    // society association
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", default: null },

    // invitation flow (for invite + accept)
    invited: { type: Boolean, default: false },
    inviteToken: { type: String, default: null, index: true },
    inviteExpiresAt: { type: Date, default: null },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    acceptedAt: { type: Date, default: null },

    status: { type: String, enum: ["active", "inactive"], default: "active" },

    // audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    isDeleted: { type: Boolean, default: false },
  },
  {
    collection: "users",
    timestamps: true,
  }
);

UserSchema.statics.VALID_ROLES = VALID_ROLES;

module.exports = mongoose.model("User", UserSchema);
