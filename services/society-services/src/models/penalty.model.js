// src/models/penalty.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Penalty or fine imposed on a user/unit for rule violations.
 */
const PenaltySchema = new Schema(
  {
    society: { type: Schema.Types.ObjectId, ref: "Society", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    unit: { type: Schema.Types.ObjectId, ref: "Unit" },

    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    amount: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ["unpaid", "paid", "waived"],
      default: "unpaid",
    },

    issuedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    paidAt: { type: Date },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "penalties" }
);

PenaltySchema.index({ society: 1, status: 1 });

module.exports = mongoose.model("Penalty", PenaltySchema);
