const mongoose = require('mongoose');

const SocietySchema = new mongoose.Schema(
  {
    // If your app supports selecting an existing project or creating a new one:
    // - store either a ref to an existing Project or the "projectName" entered when creating new.
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: false,
    },
    projectName: {
      type: String, // used when user creates a new project inline
      required: false,
      trim: true,
    },

    // Core society details
    societyName: {
      type: String,
      required: true,
      trim: true,
    },

    // Territory could be a string or ref to separate Territory collection if you have one
    territory: {
      type: String,
      required: false,
      trim: true,
    },

    // Full postal address
    address: {
      type: String,
      required: false,
      trim: true,
    },

    // Society admin / manager contact (stored as embedded object)
    admin: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, trim: true },
      countryCode: { type: String, trim: true }, // e.g. +91
      mobileNumber: { type: String, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      userRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
      }, // optional link to User document
    },

    // Optional flags
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },

    // Any extra metadata you want to track
    meta: {
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      notes: { type: String },
    },
  },
  { timestamps: true, collection: 'societies' }
);

// Compound index to avoid duplicate society names within same territory (optional)
SocietySchema.index(
  { societyName: 1, territory: 1 },
  { unique: true, partialFilterExpression: { societyName: { $exists: true } } }
);

// Simple virtual for full admin name
SocietySchema.virtual('admin.fullName').get(function () {
  return `${this.admin.firstName || ''}${
    this.admin.lastName ? ' ' + this.admin.lastName : ''
  }`.trim();
});

module.exports = mongoose.model('Society', SocietySchema);
