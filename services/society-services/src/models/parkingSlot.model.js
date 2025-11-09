// src/models/parkingSlot.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * ParkingSlot model
 * Represents individual parking slots inside a Parking area.
 * These are linked to a building/block and can be assigned to users/vehicles.
 */

const ParkingSlotSchema = new Schema(
  {
    society: { type: Schema.Types.ObjectId, ref: "Society", required: true },
    parking: { type: Schema.Types.ObjectId, ref: "Parking" }, // link to parking area
    block: { type: Schema.Types.ObjectId, ref: "Block" },
    building: { type: Schema.Types.ObjectId, ref: "BuildingSetting" },

    slotNumber: { type: String, required: true, trim: true, maxlength: 100 },

    slotType: {
      type: String,
      enum: ["car", "bike", "visitor", "ev"],
      default: "car",
    },

    // whether slot is free or assigned
    isAvailable: { type: Boolean, default: true },

    // optional assigned user/vehicle info
    currentUser: { type: Schema.Types.ObjectId, ref: "User" },
    vehicleNumber: { type: String, trim: true },
    assignedAt: { type: Date },

    // slot status
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    // Audit
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "parkingSlots" }
);

// Enforce unique slot number per society or per parking area
ParkingSlotSchema.index(
  { society: 1, slotNumber: 1 },
  { unique: true, partialFilterExpression: { slotNumber: { $exists: true } } }
);

module.exports = mongoose.model("ParkingSlot", ParkingSlotSchema);
