// models/unit.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const UnitSchema = new Schema(
  {
    block: { type: Schema.Types.ObjectId, ref: "Block", required: true },
    floor: { type: Schema.Types.ObjectId, ref: "Floor", required: true },

    // e.g., "A-101"
    unitNumber: { type: String, required: true, trim: true, maxlength: 100 },

    // e.g., '1BHK', '2BHK', 'Studio', 'Commercial'
    unitType: { type: String, trim: true, maxlength: 100 },

    // area in sqft (or whatever unit you prefer)
    areaSqFt: { type: Number, min: 0 },

    // status (vacant/occupied/blocked etc)
    status: {
      type: String,
      enum: ["vacant", "occupied", "blocked", "maintenance"],
      default: "vacant",
    },

    // Optional owner/resident user reference
    owner: { type: Schema.Types.ObjectId, ref: "User" },

    // Audit
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "units" }
);

// enforce unique unitNumber per floor (you may prefer per block+unitNumber instead)
UnitSchema.index({ floor: 1, unitNumber: 1 }, { unique: true });

module.exports = mongoose.model("Unit", UnitSchema);
