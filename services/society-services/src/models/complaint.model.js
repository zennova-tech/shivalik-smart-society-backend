// models/complaint.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const ComplaintSchema = new Schema(
  {
    category: { type: String, required: true, trim: true },
    location: { type: String, trim: true }, // e.g., "A-101, Block B"
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    description: { type: String, required: true, trim: true },

    // file urls
    images: [{ type: String, trim: true }],
    audioUrl: { type: String, trim: true },

    // lifecycle
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed", "archived"],
      default: "open",
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "Employee" }, // optional

    // comments array (simple)
    comments: [
      {
        comment: String,
        commentedBy: { type: Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resolvedAt: { type: Date },
  },
  { timestamps: true, collection: "complaints" }
);

// useful indexes for queries
ComplaintSchema.index({ status: 1, priority: 1, createdAt: -1 });
ComplaintSchema.index({ category: 1 });

module.exports = mongoose.model("Complaint", ComplaintSchema);
