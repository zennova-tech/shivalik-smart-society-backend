const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    passwordHash: String,
    role: {
      type: String,
      enum: ["admin", "resident", "staff"],
      default: "resident",
    },
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society" },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "users" }
);

module.exports = mongoose.model("User", UserSchema);
