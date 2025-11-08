// models/block.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const BlockSchema = new Schema(
  {
    // Block name shown in UI
    name: { type: String, required: true, trim: true, maxlength: 200 },

    // Reference to the Building this block belongs to (optional)
    building: { type: Schema.Types.ObjectId, ref: "BuildingSetting" },

    // Status active/inactive (used for soft delete + UI)
    status: { type: String, enum: ["active", "inactive"], default: "active" },

    // Audit
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "blocks" }
);

// Unique block name per building (if building exists)
BlockSchema.index(
  { building: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { name: { $exists: true }, building: { $exists: true } },
  }
);

module.exports = mongoose.model("Block", BlockSchema);
