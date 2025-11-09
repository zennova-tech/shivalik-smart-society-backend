// src/models/event.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const EventSchema = new Schema(
  {
    society: { type: Schema.Types.ObjectId, ref: "Society", required: true, index: true },

    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, default: "", trim: true },

    // event start / end timestamps
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true },

    // optional images (s3 keys / urls)
    images: [{ type: String }],

    // who created the event
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },

    // status (draft / published / cancelled)
    status: { type: String, enum: ["draft", "published", "cancelled"], default: "published" },

    // visibility: society-wide, block-only, or specific units/roles (optional)
    visibility: {
      type: String,
      enum: ["society", "block", "unit", "custom"],
      default: "society",
    },

    // optional metadata for audience targeting (array of block/unit ids or role names)
    audience: [{ type: Schema.Types.Mixed }],
  },
  {
    timestamps: true,
    collection: "events",
  }
);

// Helpful indexes
EventSchema.index({ society: 1, startAt: 1 });
EventSchema.index({ society: 1, status: 1 });

module.exports = mongoose.model("Event", EventSchema);
