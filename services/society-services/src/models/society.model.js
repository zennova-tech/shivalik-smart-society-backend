// src/models/society.model.js
const mongoose = require("mongoose");

const SocietySchema = new mongoose.Schema(
  {
    code: { type: String, index: true, unique: true }, // you can auto-generate
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },

    name: { type: String, required: true },
    territory: { type: String, default: "" },
    address: { type: String, default: "" },

    // link to society manager (user._id)
    adminManager: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // blocks embedded (lightweight)
    blocks: [
      {
        name: String,
        floors: Number,
        unitsCount: Number,
      },
    ],

    // audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    isDeleted: { type: Boolean, default: false },
  },
  {
    collection: "societies",
    timestamps: true,
  }
);

module.exports = mongoose.model("Society", SocietySchema);
