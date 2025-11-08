const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String },
    countryCode: String,
    mobileNumber: String,
    email: String,

    personalAddress: String,
    pinCode: String,

    userType: {
      type: String,
      enum: ['plumber', 'cleaner'],
      required: true,
    },

    idProofType: {
      type: String,
      enum: ['adharcard', 'driving_licence', 'pan_card'],
    },

    proofAttachment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attachment',
    },
    policeVerificationProof: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attachment',
    },

    shift: {
      startTime: String,
      endTime: String,
      workingDays: [{ type: String }], // e.g., ['Mon', 'Tue', 'Wed']
    },

    onPayroll: {
      type: String,
      enum: ['society', 'agency'],
      default: 'society',
    },

    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },

    society: { type: mongoose.Schema.Types.ObjectId, ref: 'Society' },
  },
  { timestamps: true, collection: 'employees' }
);

module.exports = mongoose.model('Employee', EmployeeSchema);
