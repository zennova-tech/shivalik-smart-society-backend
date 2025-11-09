// src/models/parkingAssignment.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * ParkingAssignment model
 * Tracks which user is assigned to which parking slot,
 * the vehicle number, duration, and status.
 */

const ParkingAssignmentSchema = new Schema(
  {
    society: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: true,
    },

    slot: {
      type: Schema.Types.ObjectId,
      ref: "ParkingSlot",
      required: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    vehicleNumber: {
      type: String,
      trim: true,
    },

    // assignment type (permanent / temporary)
    type: {
      type: String,
      enum: ["permanent", "temporary"],
      default: "permanent",
    },

    startAt: {
      type: Date,
      default: Date.now,
    },

    endAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },

    // Audit
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    collection: "parkingAssignments",
  }
);

// Index to prevent duplicate active assignment for same slot
ParkingAssignmentSchema.index(
  { slot: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);

module.exports = mongoose.model("ParkingAssignment", ParkingAssignmentSchema);
