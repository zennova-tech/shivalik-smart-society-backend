// src/models/gallery.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Stores images or videos uploaded to a society gallery.
 */
const GallerySchema = new Schema(
  {
    society: { type: Schema.Types.ObjectId, ref: "Society", required: true },

    title: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true },

    // array of image URLs (stored on S3 or local)
    images: [{ type: String, required: true }],

    type: {
      type: String,
      enum: ["image", "video", "mixed"],
      default: "image",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "galleries" }
);

GallerySchema.index({ society: 1, title: "text", description: "text" });

module.exports = mongoose.model("Gallery", GallerySchema);
