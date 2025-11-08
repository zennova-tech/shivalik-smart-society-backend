// models/floor.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const FloorSchema = new Schema(
  {
    // e.g., "Floor 1", "F1", etc.
    name: { type: String, required: true, trim: true, maxlength: 200 },

    // numeric floor identifier (useful for sorting)
    number: { type: Number, required: true },

    // block this floor belongs to (required)
    block: { type: Schema.Types.ObjectId, ref: "Block", required: true },

    // optional building reference for convenience
    building: { type: Schema.Types.ObjectId, ref: "BuildingSetting" },

    // status for soft-delete
    status: { type: String, enum: ["active", "inactive"], default: "active" },

    // audit fields
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "floors" }
);

// Ensure unique floor number within same block
FloorSchema.index({ block: 1, number: 1 }, { unique: true });

// Optionally also ensure unique name per block
FloorSchema.index(
  { block: 1, name: 1 },
  { unique: true, partialFilterExpression: { name: { $exists: true } } }
);

module.exports = mongoose.model("Floor", FloorSchema);
