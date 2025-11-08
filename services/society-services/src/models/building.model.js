// models/building-setting.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const SocietySnapshotSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String, trim: true },
    // optional ref to a full Society document if you maintain a collection
    ref: { type: Schema.Types.ObjectId, ref: "Society" },
  },
  { _id: false }
);

const BuildingSettingSchema = new Schema(
  {
    society: {
      type: SocietySnapshotSchema,
      required: true,
    },

    // Basic information (from your screenshot)
    buildingName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },

    // PIN code (India-like validation: 6 digits). Adjust regex to your requirements.
    pinCode: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v) => /^\d{6}$/.test(v),
        message: (props) => `${props.value} is not a valid pin code (expected 6 digits)`,
      },
    },

    // Counters from the form
    totalBlocks: { type: Number, default: 0, min: 0 },
    totalUnits: { type: Number, default: 0, min: 0 },

    // Building type drop-down (adjust values as needed)
    buildingType: {
      type: String,
      enum: ["residential", "commercial", "mixed"],
      default: "residential",
    },

    // optional territory / wing field (present in earlier model)
    territory: { type: String, trim: true },

    // Active/inactive status
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    // Audit fields - reference your User model
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    collection: "buildingSettings",
  }
);

// Ensure unique building name within the same society (when society.ref exists)
BuildingSettingSchema.index(
  { "society.ref": 1, buildingName: 1 },
  { unique: true, partialFilterExpression: { "society.ref": { $exists: true } } }
);

// Text index to help search by building and society name
BuildingSettingSchema.index({
  buildingName: "text",
  "society.name": "text",
  address: "text",
  city: "text",
  state: "text",
});

// Instance helper
BuildingSettingSchema.methods.getFullAddress = function () {
  const parts = [
    this.buildingName,
    this.address,
    this.territory,
    this.city,
    this.state,
    this.pinCode,
  ].filter(Boolean);
  return parts.join(", ");
};

module.exports = mongoose.model("BuildingSetting", BuildingSettingSchema);
