// src/models/booking.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const BookingSchema = new Schema(
  {
    society: { type: Schema.Types.ObjectId, ref: "Society", required: true },
    amenity: { type: Schema.Types.ObjectId, ref: "Amenity", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Date of the booking (no time portion)
    slotDate: { type: Date, required: true },

    // Optional slot times (HH:mm)
    slotFrom: { type: String, default: null },
    slotTo: { type: String, default: null },

    // optional price or amount paid
    price: { type: Number, default: 0 },

    // booking status
    status: {
      type: String,
      enum: ["booked", "cancelled", "completed"],
      default: "booked",
    },

    // payment reference (if integrated)
    paymentRef: { type: String, trim: true },

    // Audit
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    collection: "bookings",
  }
);

// Helpful indexes
BookingSchema.index({ society: 1, slotDate: 1 });
BookingSchema.index({ amenity: 1, slotDate: 1, slotFrom: 1 });

module.exports = mongoose.model("Booking", BookingSchema);
