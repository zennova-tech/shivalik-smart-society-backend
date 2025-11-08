// models/notice.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const NoticeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, required: true, trim: true },

    // category and priority - adjust enum values as you need
    category: {
      type: String,
      enum: ["general", "maintenance", "security", "event", "other"],
      default: "general",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // scope: optional block and unit (if it's specific), otherwise null => society-wide
    block: { type: Schema.Types.ObjectId, ref: "Block" },
    unit: { type: Schema.Types.ObjectId, ref: "Unit" },

    // publish and expiry windows
    publishDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },

    // visible/active status
    status: {
      type: String,
      enum: ["published", "draft", "expired", "archived"],
      default: "published",
    },

    // who created / updated
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "notices" }
);

// helpful index to quickly find active/published notices
NoticeSchema.index({ status: 1, publishDate: 1, expiryDate: 1 });
NoticeSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Notice", NoticeSchema);
