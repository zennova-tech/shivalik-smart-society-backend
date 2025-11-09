// src/controllers/society.controller.js
const Society = require("../models/society.model");
const User = require("../models/user.model");
const { sendManagerInvite } = require("../utils/invite");
const { success, fail } = require("../utils/response");
const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

/**
 * Auto-generate a short society code (e.g. SHV-2025-XXXX)
 */
function generateSocietyCode(name = "") {
  const prefix = (name || "SOC").replace(/\s+/g, "").slice(0, 3).toUpperCase();
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${suffix}`;
}

function generateTempPassword(length = 10) {
  // generate a URL-safe base64-like password and keep to requested length
  return crypto
    .randomBytes(Math.ceil((length * 3) / 4))
    .toString("base64")
    .replace(/[+/=]/g, "")
    .slice(0, length);
}

exports.createSociety = async (req, res, next) => {
  try {
    const { projectId, name, territory, address, manager } = req.body;
    if (!name || !manager || !manager.email || !manager.firstName) {
      return fail(res, "Missing required fields (name & manager.firstName & manager.email)", 400);
    }

    // create society
    const code = generateSocietyCode(name);
    const creatorId = req.user ? req.user.sub || req.user.id : null;
    const society = await Society.create({
      project: projectId || null,
      name,
      territory: territory || "",
      address: address || "",
      code,
      createdBy: creatorId,
    });

    // create manager account with password now
    const managerEmail = manager.email.toLowerCase();
    let managerUser = await User.findOne({ email: managerEmail });

    // generate a temporary password (10 chars) and hash it
    const tempPassword = generateTempPassword(12); // adjust length if required
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const now = new Date();
    if (managerUser) {
      // update existing user: set role to manager, set password hash, link society
      managerUser.role = "manager";
      managerUser.society = society._id;
      managerUser.passwordHash = passwordHash;
      managerUser.invited = false; // account already has password
      managerUser.inviteToken = null;
      managerUser.inviteExpiresAt = null;
      managerUser.invitedBy = creatorId;
      managerUser.forcePasswordReset = false; // require change on first login
      managerUser.updatedBy = creatorId;
      managerUser.updatedAt = now;
      await managerUser.save();
    } else {
      // create a new user with password
      managerUser = await User.create({
        firstName: manager.firstName,
        lastName: manager.lastName || "",
        email: managerEmail,
        countryCode: manager.countryCode || "+91",
        mobileNumber: manager.mobileNumber || null,
        role: "manager",
        society: society._id,
        passwordHash,
        invited: false,
        inviteToken: null,
        inviteExpiresAt: null,
        invitedBy: creatorId,
        forcePasswordReset: false,
        status: "active",
        createdBy: creatorId,
        createdAt: now,
        updatedAt: now,
      });
    }

    // link society.adminManager to managerUser._id
    society.adminManager = managerUser._id;
    await society.save();

    // send email containing the temp password (best-effort)
    const emailSent = await sendManagerInvite({
      toEmail: managerUser.email,
      firstName: managerUser.firstName,
      societyName: society.name,
      tempPassword, // pass temp password to email helper
      changePasswordUrl: `${process.env.APP_URL || "http://localhost:3000"}/change-password`, // frontend link
    });

    const data = {
      society,
      manager: { id: managerUser._id, email: managerUser.email },
      inviteSent: emailSent,
    };

    return success(res, "Society created and manager invited (password created)", data, 201);
  } catch (err) {
    logger.error("Error creating society", err);
    return next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const hard = req.query.hard === "true";
    if (hard) {
      const removed = await Society.findByIdAndDelete(req.params.id);
      if (!removed) return res.status(404).json({ message: "Complaint not found" });
      return res.json({ message: "Complaint permanently deleted" });
    } else {
      const updated = await Society.findByIdAndUpdate(
        req.params.id,
        { status: "archived" },
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: "Society not found" });
      return res.json({ message: "Society archived", complaint: updated });
    }
  } catch (err) {
    next(err);
  }
};
