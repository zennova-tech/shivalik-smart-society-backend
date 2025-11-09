// src/models/bill.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Maintenance or utility bills raised to a unit or society member.
 */
const BillSchema = new Schema(
  {
    society: { type: Schema.Types.ObjectId, ref: "Society", required: true },
    unit: { type: Schema.Types.ObjectId, ref: "Unit" },
    user: { type: Schema.Types.ObjectId, ref: "User" },

    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date },
    paidDate: { type: Date },

    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },

    paymentRef: { type: String, trim: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "bills" }
);

BillSchema.index({ society: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model("Bill", BillSchema);
