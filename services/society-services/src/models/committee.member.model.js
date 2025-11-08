// models/committeeMember.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const CommitteeMemberSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 150 },
    lastName: { type: String, trim: true, maxlength: 150 },

    countryCode: { type: String, trim: true, default: "+91" },
    mobileNumber: { type: String, required: true, trim: true },

    email: { type: String, required: true, trim: true, lowercase: true },

    // type/role on committee
    memberType: {
      type: String,
      enum: ["chairman", "secretary", "treasurer", "member", "other"],
      default: "member",
    },

    // optional association to society/building/block
    society: { type: Schema.Types.ObjectId, ref: "Society" },
    building: { type: Schema.Types.ObjectId, ref: "BuildingSetting" },
    block: { type: Schema.Types.ObjectId, ref: "Block" },

    // active/inactive, soft-delete
    status: {
      type: String,
      enum: ["active", "inactive", "resigned", "archived"],
      default: "active",
    },

    // who created / updated
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "committeeMembers" }
);

// unique mobile/email per society (partial index if society exists)
CommitteeMemberSchema.index(
  { society: 1, mobileNumber: 1 },
  { unique: true, partialFilterExpression: { society: { $exists: true } } }
);
CommitteeMemberSchema.index(
  { society: 1, email: 1 },
  { unique: true, partialFilterExpression: { society: { $exists: true } } }
);

CommitteeMemberSchema.index({ email: 1 });
CommitteeMemberSchema.index({ mobileNumber: 1 });

module.exports = mongoose.model("CommitteeMember", CommitteeMemberSchema);
