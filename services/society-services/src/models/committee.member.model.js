const mongoose = require('mongoose');

const CommitteeMemberSchema = new mongoose.Schema(
  {
    // If user selected from existing Member/Tenant
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    firstName: { type: String, required: true },
    lastName: { type: String },
    countryCode: { type: String },
    mobileNumber: { type: String },
    email: { type: String },

    role: {
      type: String,
      enum: ['chairman', 'secretary', 'treasurer'],
      required: true,
    },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },

    society: { type: mongoose.Schema.Types.ObjectId, ref: 'Society' },
  },
  { timestamps: true, collection: 'committee_members' }
);

module.exports = mongoose.model('CommitteeMember', CommitteeMemberSchema);
