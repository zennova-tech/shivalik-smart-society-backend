// src/controllers/society.controller.js
const Society = require("../models/society.model");
const User = require("../models/user.model");
const { generateInviteToken, sendManagerInvite } = require("../utils/invite");
const { success, fail } = require("../utils/response");
const logger = require("../utils/logger");

/**
 * Auto-generate a short society code (e.g. SHV-2025-XXXX)
 */
function generateSocietyCode(name = "") {
  const prefix = (name || "SOC").replace(/\s+/g, "").slice(0, 3).toUpperCase();
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${suffix}`;
}

/**
 * POST /api/v1/societies
 * Body:
 * {
 *   projectId, name, territory, address,
 *   manager: { firstName, lastName, countryCode, mobileNumber, email }
 * }
 * Auth: required + authorize(['superadmin','admin'])
 */
exports.createSociety = async (req, res, next) => {
  try {
    const { projectId, name, territory, address, manager } = req.body;
    if (!name || !manager || !manager.email || !manager.firstName) {
      return fail(res, "Missing required fields (name & manager.firstName & manager.email)", 400);
    }

    // create society
    const code = generateSocietyCode(name);
    const society = await Society.create({
      project: projectId || null,
      name,
      territory: territory || "",
      address: address || "",
      code,
      createdBy: req.user ? req.user.sub : null,
    });

    // create or update manager user (invite)
    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiry

    // Try find existing user by email
    let managerUser = await User.findOne({ email: manager.email.toLowerCase() });

    if (managerUser) {
      // attach society, add manager role if not present, set invite fields
      const existingRoles = Array.isArray(managerUser.roles) ? managerUser.roles : ["member"];
      if (!existingRoles.includes("manager")) existingRoles.push("manager");
      managerUser.roles = existingRoles;
      managerUser.society = society._id;
      managerUser.invited = true;
      managerUser.inviteToken = token;
      managerUser.inviteExpiresAt = expiresAt;
      managerUser.invitedBy = req.user ? req.user.sub : null;
      await managerUser.save();
    } else {
      // create a new invited user record
      managerUser = await User.create({
        firstName: manager.firstName,
        lastName: manager.lastName || "",
        email: manager.email.toLowerCase(),
        countryCode: manager.countryCode || "+91",
        mobileNumber: manager.mobileNumber || null,
        roles: ["manager"],
        society: society._id,
        invited: true,
        inviteToken: token,
        inviteExpiresAt: expiresAt,
        invitedBy: req.user ? req.user.sub : null,
        status: "active",
        createdBy: req.user ? req.user.sub : null,
      });
    }

    // link society.adminManager to managerUser._id
    society.adminManager = managerUser._id;
    await society.save();

    // send invite email (best-effort)
    const emailSent = await sendManagerInvite({
      toEmail: managerUser.email,
      firstName: managerUser.firstName,
      societyName: society.name,
      token,
    });

    const data = {
      society,
      manager: { id: managerUser._id, email: managerUser.email },
      inviteSent: emailSent,
    };

    return success(res, "Society created and manager invited", data, 201);
  } catch (err) {
    logger.error("Error creating society", err);
    return next(err);
  }
};
