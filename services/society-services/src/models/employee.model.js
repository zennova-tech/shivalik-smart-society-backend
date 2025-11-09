// models/employee.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const EmployeeSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 150 },
    lastName: { type: String, trim: true, maxlength: 150 },

    countryCode: { type: String, trim: true, default: "+91" },
    mobileNumber: { type: String, required: true, trim: true },

    email: { type: String, required: true, trim: true, lowercase: true },

    employeeType: {
      type: String,
      enum: ["security", "gardener", "electrician", "cleaning", "admin", "other"],
      required: true,
      default: "other",
    },

    // file URLs
    idProofUrl: { type: String, trim: true },
    policeVerificationUrl: { type: String, trim: true },

    society: { type: Schema.Types.ObjectId, ref: "Society" },
    building: { type: Schema.Types.ObjectId, ref: "BuildingSetting" },
    block: { type: Schema.Types.ObjectId, ref: "Block" },

    status: { type: String, enum: ["active", "inactive", "terminated"], default: "active" },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "employees" }
);

EmployeeSchema.index(
  { society: 1, mobileNumber: 1 },
  { unique: true, partialFilterExpression: { society: { $exists: true } } }
);
EmployeeSchema.index(
  { society: 1, email: 1 },
  { unique: true, partialFilterExpression: { society: { $exists: true } } }
);

module.exports = mongoose.model("Employee", EmployeeSchema);
