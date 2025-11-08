const mongoose = require("mongoose");

const SocietySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String },
    adminUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    blocks: [{ name: String, floors: Number }],
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "societies" }
);

module.exports = mongoose.model("Society", SocietySchema);
