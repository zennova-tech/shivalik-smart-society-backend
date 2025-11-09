// src/controllers/userRegistration.controller.js
const User = require("../models/user.model");
const Society = require("../models/society.model");
const BuildingSetting = require("../models/building.model");
const Block = require("../models/block.model");
const Unit = require("../models/unit.model");
const Floor = require("../models/floor.model");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { success, fail } = require("../utils/response");
const logger = require("../utils/logger");
const path = require("path");

/**
 * GET /api/v1/user/register/societies
 * Get list of societies for registration (public endpoint)
 */
exports.getSocieties = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const filter = { isDeleted: { $ne: true } };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { territory: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const societies = await Society.find(filter)
      .select("name territory address code")
      .sort({ name: 1 })
      .lean();

    // Get counts for each society
    const societiesWithCounts = await Promise.all(
      societies.map(async (society) => {
        const societyId = society._id;

        // Get buildings for this society
        const buildings = await BuildingSetting.find({ "society.ref": societyId })
          .select("_id")
          .lean();
        const buildingIds = buildings.map((b) => b._id);

        // Get blocks count
        const blocksCount = await Block.countDocuments({
          building: { $in: buildingIds },
          status: "active",
        });

        // Get members count
        const membersCount = await User.countDocuments({
          society: societyId,
          isDeleted: { $ne: true },
        });

        return {
          _id: society._id,
          name: society.name,
          location: society.territory || society.address || "",
          membersCount,
          blocksCount,
        };
      })
    );

    return success(res, "Societies fetched successfully", societiesWithCounts);
  } catch (err) {
    logger.error("Error in getSocieties", err);
    return next(err);
  }
};

/**
 * GET /api/v1/user/register/societies/:societyId/blocks
 * Get blocks for a society (public endpoint)
 */
exports.getSocietyBlocks = async (req, res, next) => {
  try {
    const { societyId } = req.params;

    // Verify society exists
    const society = await Society.findById(societyId);
    if (!society || society.isDeleted) {
      return fail(res, "Society not found", 404);
    }

    // Get buildings for this society
    const buildings = await BuildingSetting.find({ "society.ref": societyId }).select("_id").lean();
    const buildingIds = buildings.map((b) => b._id);

    if (buildingIds.length === 0) {
      return success(res, "Blocks fetched successfully", []);
    }

    // Get blocks for these buildings
    const blocks = await Block.find({
      building: { $in: buildingIds },
      status: "active",
    })
      .select("_id name building status")
      .sort({ name: 1 })
      .lean();

    return success(res, "Blocks fetched successfully", blocks);
  } catch (err) {
    logger.error("Error in getSocietyBlocks", err);
    return next(err);
  }
};

/**
 * GET /api/v1/user/register/societies/:societyId/blocks/:blockId/units
 * Get units for a block (public endpoint, show available units)
 */
exports.getBlockUnits = async (req, res, next) => {
  try {
    const { societyId, blockId } = req.params;

    // Verify society exists
    const society = await Society.findById(societyId);
    if (!society || society.isDeleted) {
      return fail(res, "Society not found", 404);
    }

    // Verify block exists and belongs to a building in this society
    const block = await Block.findById(blockId).populate("building").lean();
    if (!block || block.status !== "active") {
      return fail(res, "Block not found", 404);
    }

    // Verify block belongs to a building in this society
    if (block.building && block.building.society && block.building.society.ref) {
      if (block.building.society.ref.toString() !== societyId) {
        return fail(res, "Block does not belong to this society", 400);
      }
    }

    // Get units for this block
    const units = await Unit.find({ block: blockId })
      .populate("floor", "name number")
      .select("_id unitNumber unitType areaSqFt status floor block")
      .sort({ unitNumber: 1 })
      .lean();

    // Transform units to match frontend format
    const transformedUnits = units.map((unit) => ({
      _id: unit._id,
      unitNumber: unit.unitNumber,
      unitType: unit.unitType,
      areaSqFt: unit.areaSqFt,
      status: unit.status === "vacant" ? "available" : "occupied",
      floor: unit.floor
        ? {
            _id: unit.floor._id,
            name: unit.floor.name,
            number: unit.floor.number,
          }
        : null,
    }));

    return success(res, "Units fetched successfully", transformedUnits);
  } catch (err) {
    logger.error("Error in getBlockUnits", err);
    return next(err);
  }
};

/**
 * POST /api/v1/user/register
 * Register a new user (Owner/Tenant) - public endpoint
 */
exports.registerUser = async (req, res, next) => {
  try {
    const {
      type,
      societyId,
      blockId,
      unitId,
      firstName,
      lastName,
      email,
      countryCode,
      mobileNumber,
      gender,
      dateOfBirth,
      occupation,
      address,
      aadharNumber,
      panNumber,
    } = req.body;

    // Validate required fields
    if (!type || !societyId || !blockId || !unitId || !firstName || !mobileNumber) {
      return fail(res, "Missing required fields", 400);
    }

    if (type !== "Owner" && type !== "Tenant") {
      return fail(res, "Invalid type. Must be Owner or Tenant", 400);
    }

    // Verify society exists
    const society = await Society.findById(societyId);
    if (!society || society.isDeleted) {
      return fail(res, "Society not found", 404);
    }

    // Verify block exists
    const block = await Block.findById(blockId);
    if (!block || block.status !== "active") {
      return fail(res, "Block not found", 404);
    }

    // Verify unit exists and belongs to the block
    const unit = await Unit.findById(unitId);
    if (!unit) {
      return fail(res, "Unit not found", 404);
    }

    // Verify unit belongs to the specified block
    if (unit.block.toString() !== blockId) {
      return fail(res, "Unit does not belong to the specified block", 400);
    }

    // Check if unit is available (vacant status and no owner)
    if (unit.status !== "vacant" || unit.owner) {
      return fail(res, "Unit is not available for registration", 400);
    }

    // Check if user already exists with this email
    if (email) {
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        isDeleted: { $ne: true },
      });
      if (existingUser) {
        return fail(res, "User with this email already exists", 409);
      }
    }

    // Check if user already exists with this mobile number
    if (mobileNumber) {
      const existingUser = await User.findOne({
        mobileNumber,
        countryCode: countryCode || "+91",
        isDeleted: { $ne: true },
      });
      if (existingUser) {
        return fail(res, "User with this mobile number already exists", 409);
      }
    }

    // Handle file uploads (from multer)
    let profilePicturePath = null;
    let ownershipProofPath = null;

    if (req.files) {
      // Multer stores files in req.files as an array or object
      const profilePic = Array.isArray(req.files.profilePicture)
        ? req.files.profilePicture[0]
        : req.files.profilePicture;
      const ownershipDoc = Array.isArray(req.files.ownershipProof)
        ? req.files.ownershipProof[0]
        : req.files.ownershipProof;

      if (profilePic) {
        profilePicturePath = `/uploads/profiles/${path.basename(profilePic.path)}`;
      }

      if (ownershipDoc && type === "Owner") {
        ownershipProofPath = `/uploads/ownership-proofs/${path.basename(ownershipDoc.path)}`;
      }
    }

    // Generate a temporary password
    const tempPassword = crypto
      .randomBytes(8)
      .toString("base64")
      .replace(/[+/=]/g, "")
      .slice(0, 10);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    // Create user
    const userData = {
      firstName,
      lastName: lastName || "",
      email: email ? email.toLowerCase() : null,
      countryCode: countryCode || "+91",
      mobileNumber,
      passwordHash,
      role: "member",
      society: societyId,
      status: "active",
      invited: false,
      // Store additional   data in a separate collection or extend User model
      // For now, we'll store basic info
    };

    const user = await User.create(userData);

    // Update unit to link owner and change status
    await Unit.findByIdAndUpdate(unitId, {
      owner: user._id,
      status: "occupied",
    });

    // TODO: Store additional user details (gender, dateOfBirth, occupation, address, aadharNumber, panNumber)
    // You may need to extend the User model or create a separate MemberDetails model
    // For now, we'll store them in a notes field or extend the model

    logger.info(`User registered: ${user._id}, Type: ${type}, Unit: ${unitId}`);

    return success(res, "Registration successful. Please login with your mobile number.", {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        society: user.society,
      },
      unit: {
        id: unit._id,
        unitNumber: unit.unitNumber,
      },
      // In production, you might want to send the temp password via SMS/Email
      // For now, returning it (remove in production)
      temporaryPassword: tempPassword,
    });
  } catch (err) {
    logger.error("Error in registerUser", err);
    if (err.code === 11000) {
      return fail(res, "User with this email or mobile number already exists", 409);
    }
    return next(err);
  }
};

exports.listGuests = async (req, res, next) => {
  try {
    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const rawLimit = req.query.limit ? Number(req.query.limit) : 20;
    const limit = Math.min(Math.max(1, rawLimit || 20), 200);
    const skip = (page - 1) * limit;

    const { q, societyId, blockId, unitId } = req.query;

    // Build Unit filter
    const unitFilter = { owner: { $exists: true, $ne: null } };

    // If unitId is provided, restrict to that unit
    if (unitId) {
      unitFilter._id = unitId;
    }

    // If blockId provided, restrict directly
    if (blockId) {
      unitFilter.block = blockId;
    }

    // If societyId provided, resolve building -> blocks -> units
    if (societyId) {
      // get building ids for society
      const buildings = await BuildingSetting.find({ "society.ref": societyId })
        .select("_id")
        .lean();
      const buildingIds = buildings.map((b) => b._id);
      if (buildingIds.length === 0) {
        // no buildings -> return empty
        return success(res, "Guests fetched", { items: [], total: 0, page, limit });
      }
      const blocks = await Block.find({ building: { $in: buildingIds } })
        .select("_id")
        .lean();
      const blockIds = blocks.map((b) => b._id);
      if (blockIds.length === 0) {
        return success(res, "Guests fetched", { items: [], total: 0, page, limit });
      }
      unitFilter.block = { $in: blockIds };
    }

    // Build user text filter (applied after populate) -> we'll filter by owner fields via aggregation if q present
    // If no free-text query: simple path (find units then populate owner)
    if (!q) {
      const [units, total] = await Promise.all([
        Unit.find(unitFilter)
          .populate("owner", "firstName lastName email countryCode mobileNumber")
          .populate("block", "name")
          .populate("floor", "name number")
          .select("_id unitNumber unitType block floor owner")
          .sort({ unitNumber: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Unit.countDocuments(unitFilter),
      ]);

      // transform to expected shape
      const items = units.map((u) => {
        const owner = u.owner || {};
        return {
          unitId: u._id,
          unitNumber: u.unitNumber,
          unitType: u.unitType || null,
          blockId: u.block ? u.block._id : null,
          blockName: u.block ? u.block.name : null,
          floor: u.floor ? { id: u.floor._id, name: u.floor.name, number: u.floor.number } : null,
          firstName: owner.firstName || null,
          lastName: owner.lastName || null,
          mobileNumber: owner.mobileNumber || null,
          countryCode: owner.countryCode || null,
          email: owner.email || null,
          userId: owner._id || null,
        };
      });

      return success(res, "Guests fetched", {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    // If free-text q is present, use aggregation to support search on owner fields and unit fields
    const search = q.trim();
    const textOrRegex = { $regex: search, $options: "i" };

    // Aggregation pipeline:
    // 1) match units (unitFilter)
    // 2) lookup owner from users
    // 3) unwind owner, match owner fields or unitNumber
    // 4) lookup block, floor
    const pipeline = [];

    // Match initial unit filter
    pipeline.push({ $match: unitFilter });

    // Lookup owner
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    });
    pipeline.push({ $unwind: "$owner" });

    // Lookup block and floor
    pipeline.push({
      $lookup: {
        from: "blocks",
        localField: "block",
        foreignField: "_id",
        as: "block",
      },
    });
    pipeline.push({ $unwind: { path: "$block", preserveNullAndEmptyArrays: true } });

    pipeline.push({
      $lookup: {
        from: "floors",
        localField: "floor",
        foreignField: "_id",
        as: "floor",
      },
    });
    pipeline.push({ $unwind: { path: "$floor", preserveNullAndEmptyArrays: true } });

    // Search match
    pipeline.push({
      $match: {
        $or: [
          { "owner.firstName": textOrRegex },
          { "owner.lastName": textOrRegex },
          { "owner.email": textOrRegex },
          { "owner.mobileNumber": textOrRegex },
          { unitNumber: textOrRegex },
          { "block.name": textOrRegex },
        ],
      },
    });

    // Count facet
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: { unitNumber: 1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              unitId: "$_id",
              unitNumber: 1,
              unitType: 1,
              blockId: "$block._id",
              blockName: "$block.name",
              floor: { id: "$floor._id", name: "$floor.name", number: "$floor.number" },
              firstName: "$owner.firstName",
              lastName: "$owner.lastName",
              mobileNumber: "$owner.mobileNumber",
              countryCode: "$owner.countryCode",
              email: "$owner.email",
              userId: "$owner._id",
            },
          },
        ],
      },
    });

    const aggRes = await Unit.aggregate(pipeline);
    const metadata = (aggRes[0].metadata && aggRes[0].metadata[0]) || { total: 0 };
    const data = aggRes[0].data || [];

    return success(res, "Guests fetched", {
      items: data,
      total: metadata.total,
      page,
      limit,
      totalPages: Math.ceil(metadata.total / limit),
    });
  } catch (err) {
    logger.error("Error in listGuests", err);
    return next(err);
  }
};
