// models/amenity.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const SlotSchema = new Schema(
  {
    startTime: { type: String, required: true }, // "09:00" (HH:mm)
    endTime: { type: String, required: true }, // "10:00"
    capacity: { type: Number, default: 1, min: 1 }, // how many people per slot (optional override)
  },
  { _id: true }
);

const AmenitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true },

    capacity: { type: Number, default: 1, min: 1 },

    amenityType: { type: String, enum: ["free", "paid"], default: "free" },

    // store photo url (you can keep file storage separately)
    photoUrl: { type: String, trim: true },

    // bookingType: oneTime (single booking), recurring (daily/weekly), slot-based etc.
    bookingType: {
      type: String,
      enum: ["one_time", "slot_based", "recurring"],
      default: "one_time",
    },

    // array of booking slots (used when bookingType === 'slot_based')
    slots: { type: [SlotSchema], default: [] },

    // how many days in advance a user can book
    advanceBookingDays: { type: Number, default: 0, min: 0 },

    // optional association to building/block (if amenity is per building)
    building: { type: Schema.Types.ObjectId, ref: "BuildingSetting" },
    block: { type: Schema.Types.ObjectId, ref: "Block" },

    // status
    status: { type: String, enum: ["available", "unavailable", "archived"], default: "available" },

    // audit
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "amenities" }
);

// Text index for quick search
AmenitySchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Amenity", AmenitySchema);
