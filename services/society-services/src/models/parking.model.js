// models/parking.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const ParkingSchema = new Schema(
  {
    // Example: "Ground Floor Parking"
    name: { type: String, required: true, trim: true, maxlength: 200 },

    // Counts
    memberCarSlots: { type: Number, default: 0, min: 0 },
    memberBikeSlots: { type: Number, default: 0, min: 0 },
    visitorCarSlots: { type: Number, default: 0, min: 0 },
    visitorBikeSlots: { type: Number, default: 0, min: 0 },

    // Optional association (if parking belongs to a building/block)
    block: { type: Schema.Types.ObjectId, ref: "Block" },
    building: { type: Schema.Types.ObjectId, ref: "BuildingSetting" },

    // status for soft-delete or active/inactive
    status: { type: String, enum: ["active", "inactive"], default: "active" },

    // audit
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "parkings" }
);

// unique parking name per building (if building exists)
ParkingSchema.index(
  { building: 1, name: 1 },
  { unique: true, partialFilterExpression: { building: { $exists: true } } }
);

module.exports = mongoose.model("Parking", ParkingSchema);
