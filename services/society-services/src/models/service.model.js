const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    vendorName: {
      type: String,
      required: [true, "Vendor name is required"],
      trim: true,
      maxlength: 150,
    },
    mobileNumber: {
      type: String,
      trim: true,
      required: [true, "Mobile number is required"],
      match: [/^\+?[0-9]{7,15}$/, "Please provide a valid phone number"], // accepts + and 7-15 digits
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, "Email is required"],
      match: [/.+@.+\..+/, "Please provide a valid email address"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // optional, remove if you don't have Users
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Useful indexes
ServiceSchema.index({ serviceName: 1 });
ServiceSchema.index({ vendorName: 1 });
ServiceSchema.index({ email: 1 });

module.exports = mongoose.model("Service", ServiceSchema);
