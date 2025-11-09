// src/controllers/society.controller.js
const Society = require("../models/society.model");
const User = require("../models/user.model");
const { sendManagerInvite } = require("../utils/invite");
const { success, fail } = require("../utils/response");
const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { default: mongoose } = require("mongoose");
const buildingModel = require("../models/building.model");
const blockModel = require("../models/block.model");
const floorModel = require("../models/floor.model");
const parkingModel = require("../models/parking.model");
const unitModel = require("../models/unit.model");
const userModel = require("../models/user.model");

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
  const societyId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(societyId)) {
    return res.status(400).json({ status: false, message: "Invalid society id" });
  }

  const societyObjId = mongoose.Types.ObjectId(societyId);

  // Construct a safe match that works whether `society` is:
  // - an embedded snapshot with { ref: ObjectId }
  // - directly an ObjectId
  // - or a plain string (fallback)
  const societyMatch = {
    $or: [{ "society.ref": societyObjId }, { society: societyObjId }, { society: societyId }],
  };

  const session = await mongoose.startSession();
  let usedTransaction = true;

  try {
    session.startTransaction();

    // Find buildings that belong to the society (safe query)
    const buildings = await buildingModel
      .find(societyMatch, null, { session })
      .select("_id")
      .lean();
    const buildingIds = buildings.map((b) => b._id);

    // blocks: same safe match (blockModel might store society as ObjectId or snapshot)
    const blocks = await blockModel.find(societyMatch, null, { session }).select("_id").lean();
    const blockIds = blocks.map((b) => b._id);

    const blockQuery = {
      $or: [{ "society.ref": societyObjId }, { society: societyObjId }, { society: societyId }],
    };
    if (buildingIds.length) blockQuery.$or.push({ building: { $in: buildingIds } });

    // floors for these blocks
    const floors = blockIds.length
      ? await floorModel
          .find({ block: { $in: blockIds } }, null, { session })
          .select("_id")
          .lean()
      : [];
    const floorIds = floors.map((f) => f._id);

    // units for these floors
    const units = floorIds.length
      ? await unitModel
          .find({ floor: { $in: floorIds } }, null, { session })
          .select("_id")
          .lean()
      : [];
    const unitIds = units.map((u) => u._id);

    // parking: allow parking to reference society in different shapes
    const parkingFilter = {
      $or: [{ "society.ref": societyObjId }, { society: societyObjId }, { society: societyId }],
    };
    if (unitIds.length) parkingFilter.$or.push({ unit: { $in: unitIds } });

    await parkingModel.deleteMany(parkingFilter, { session });

    // delete units
    if (unitIds.length) {
      await unitModel.deleteMany({ _id: { $in: unitIds } }, { session });
    }

    // delete floors
    if (floorIds.length) {
      await floorModel.deleteMany({ _id: { $in: floorIds } }, { session });
    }

    // delete blocks
    if (blockIds.length) {
      await blockModel.deleteMany({ _id: { $in: blockIds } }, { session });
    }

    // delete buildings
    if (buildingIds.length) {
      await buildingModel.deleteMany({ _id: { $in: buildingIds } }, { session });
    }

    // delete managers/users for society — use same flexible match
    const userMatch = { $or: [{ society: societyObjId }, { society: societyId }] };
    await userModel.deleteMany(userMatch, { session });

    // finally delete society document itself (Society collection)
    const deleted = await Society.findOneAndDelete({ _id: societyObjId }, { session });

    if (!deleted) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ status: false, message: "Society not found" });
    }

    await session.commitTransaction();
    session.endSession();

    return res.json({ status: true, message: "Society and related data deleted successfully" });
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch (_) {}
    session.endSession();

    // existing fallback logic — apply same flexible matching when running without session
    if ((err && /transactions are not supported/i.test(String(err))) || err.name === "MongoError") {
      usedTransaction = false;
      try {
        const blocks = await blockModel.find(societyMatch).select("_id").lean();
        const blockIds = blocks.map((b) => b._id);
        const floors = blockIds.length
          ? await floorModel
              .find({ block: { $in: blockIds } })
              .select("_id")
              .lean()
          : [];
        const floorIds = floors.map((f) => f._id);
        const units = floorIds.length
          ? await unitModel
              .find({ floor: { $in: floorIds } })
              .select("_id")
              .lean()
          : [];
        const unitIds = units.map((u) => u._id);

        const parkingFilter = {
          $or: [{ "society.ref": societyObjId }, { society: societyObjId }, { society: societyId }],
        };
        if (unitIds.length) parkingFilter.$or.push({ unit: { $in: unitIds } });

        await parkingModel.deleteMany(parkingFilter);
        if (unitIds.length) await unitModel.deleteMany({ _id: { $in: unitIds } });
        if (floorIds.length) await floorModel.deleteMany({ _id: { $in: floorIds } });
        if (blockIds.length) await blockModel.deleteMany({ _id: { $in: blockIds } });
        await userModel.deleteMany({ $or: [{ society: societyObjId }, { society: societyId }] });
        const deleted = await Society.findOneAndDelete({ _id: societyObjId });
        if (!deleted) return res.status(404).json({ status: false, message: "Society not found" });

        return res.json({
          status: true,
          message:
            "Society and related data deleted successfully (without transaction). Note: without transactions, partial deletes may occur if errors happen.",
        });
      } catch (fallbackErr) {
        return res.status(500).json({
          status: false,
          message: "Failed to delete society (fallback): " + fallbackErr.message,
        });
      }
    }

    console.error("Delete society error:", err);
    return res
      .status(500)
      .json({ status: false, message: "Failed to delete society: " + err.message });
  }
};

exports.getSocietyDetails = async (req, res, next) => {
  try {
    const societyId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(societyId)) {
      return res.status(400).json({ message: "Invalid society ID" });
    }

    const societyObj = await Society.findById(societyId).lean();
    if (!societyObj) {
      return res.status(404).json({ message: "Society not found" });
    }

    const oid = new mongoose.Types.ObjectId(societyId);
    const tryQueries = [
      { q: { "society.ref": oid }, note: "society.ref as ObjectId" },
      { q: { "society.ref": societyId }, note: "society.ref as string" },
      { q: { society: oid }, note: "society top-level ObjectId" },
      { q: { society: societyId }, note: "society top-level string" },
      { q: { "society._id": oid }, note: "society._id nested ObjectId" },
      { q: { "society._id": societyId }, note: "society._id nested string" },
    ];

    let buildings = [];
    let matched = null;

    for (const t of tryQueries) {
      buildings = await buildingModel.find(t.q).lean();
      if (buildings && buildings.length) {
        matched = t.note;
        break;
      }
    }

    if (!buildings || buildings.length === 0) {
      // helpful dev-only payload
      const debug =
        process.env.NODE_ENV === "development"
          ? { tried: tryQueries.map((t) => t.note) }
          : undefined;

      return res.status(404).json({
        message: "No buildings found for this society",
        society: { _id: societyObj._id, name: societyObj.name },
        debug,
      });
    }

    const buildingIds = buildings.map((b) => b._id);
    const [blocks, parkings] = await Promise.all([
      blockModel.find({ building: { $in: buildingIds } }).lean(),
      parkingModel.find({ building: { $in: buildingIds } }).lean(),
    ]);

    const blocksByBuilding = {};
    blocks.forEach((blk) => {
      blocksByBuilding[String(blk.building)] = blocksByBuilding[String(blk.building)] || [];
      blocksByBuilding[String(blk.building)].push(blk);
    });

    const parkingsByBuilding = {};
    parkings.forEach((p) => {
      parkingsByBuilding[String(p.building)] = parkingsByBuilding[String(p.building)] || [];
      parkingsByBuilding[String(p.building)].push(p);
    });

    const society = {
      _id: String(societyObj._id),
      name: societyObj.name,
      logo: societyObj.logo,
      buildingQuery: matched || null,
      buildings: buildings.map((b) => ({
        ...b,
        blocks: blocksByBuilding[String(b._id)] || [],
        parkings: parkingsByBuilding[String(b._id)] || [],
      })),
    };

    return res.json({ success: true, data: society });
  } catch (err) {
    next(err);
  }
};
