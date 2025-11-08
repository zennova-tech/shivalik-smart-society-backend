const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    mobile: { type: String, required: true, unique: true, index: true },
    role: { type: String, enum: ["admin", "resident", "staff"], default: "resident" },
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "users" }
);

module.exports = mongoose.model("User", UserSchema);
