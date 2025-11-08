const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema(
  {
    fileUrl: { type: String, required: true }, // uploaded file path or URL
    filename: String,
    fileType: String, // 'id_proof', 'police_verification', etc.

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    society: { type: mongoose.Schema.Types.ObjectId, ref: 'Society' },
  },
  { timestamps: true, collection: 'attachments' }
);

module.exports = mongoose.model('Attachment', AttachmentSchema);
