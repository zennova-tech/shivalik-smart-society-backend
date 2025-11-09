const { default: mongoose } = require("mongoose");
const buildingModel = require("../models/building.model");

exports.create = async (req, res, next) => {
  try {
    const payload = {
      society: {
        name: req.body.society?.name,
        logo: req.body.society?.logo || undefined,
        ref: req.body.society?.ref || undefined,
      },
      buildingName: req.body.buildingName,
      address: req.body.address,
      territory: req.body.territory,
      city: req.body.city,
      state: req.body.state,
      pinCode: req.body.pinCode,
      totalBlocks: req.body.totalBlocks ?? 0,
      totalUnits: req.body.totalUnits ?? 0,
      buildingType: req.body.buildingType ? req.body.buildingType.toLowerCase() : undefined,
      createdBy: "690f738ef35f6b855a7b7746",
    };

    const created = await buildingModel.create(payload);
    return res.status(201).json(created);
  } catch (err) {
    // duplicate key or other errors
    if (err.code === 11000) {
      return res.status(409).json({ message: "Building already exists for this society" });
    }
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    // Safe pagination parsing
    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const rawLimit = req.query.limit ? Number(req.query.limit) : 20;
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 20 : rawLimit), 500);
    const skip = (page - 1) * limit;

    const q = req.query.q;
    const filter = {};

    // Society ID from route params
    const societyId = req.params.id;

    if (!societyId) {
      return res.status(400).json({ message: "Society ID is required in params" });
    }

    // Match buildings whose society.ref equals the passed society ID
    filter["society.ref"] = societyId;

    // Optional text search (building/society name)
    if (q) filter.$text = { $search: q };

    // Optional status filter
    if (req.query.status) filter.status = req.query.status;

    // Fetch data
    const [items, total] = await Promise.all([
      buildingModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      buildingModel.countDocuments(filter),
    ]);

    // If no buildings found for this society
    if (!items || items.length === 0) {
      // Option 1 (recommended): return empty array
      return res.json({ items: [], total: 0, page, limit });

      // Option 2 (strict): uncomment below to return 404
      // return res.status(404).json({ message: "No buildings found for this society" });
    }

    return res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const doc = await buildingModel
      .findById(id)
      .populate("createdBy updatedBy", "firstName lastName email")
      .lean();
    if (!doc) return res.status(404).json({ message: "Building not found" });
    return res.json(doc);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const paramId = req.params.id;
    const bodySocietyId = req.body.societyId;
    const userId = (req.user && req.user._id) || "000000000000000000000000";

    // determine societyRef for creation: prefer explicit body.societyId, otherwise use param id
    const societyRefForCreate = bodySocietyId || paramId || undefined;

    // Build normalized payload (only include fields that are passed)
    const normalized = {};

    // accept society object if provided in body (e.g. { society: { name, logo } })
    if (req.body.society && typeof req.body.society === "object") {
      normalized.society = {};
      if (req.body.society.name !== undefined) normalized.society.name = req.body.society.name;
      if (req.body.society.logo !== undefined) normalized.society.logo = req.body.society.logo;
      if (req.body.society.ref !== undefined) normalized.society.ref = req.body.society.ref;
    }

    // top-level fields
    if (req.body.buildingName !== undefined) normalized.buildingName = req.body.buildingName;
    if (req.body.address !== undefined) normalized.address = req.body.address;
    if (req.body.territory !== undefined) normalized.territory = req.body.territory;
    if (req.body.city !== undefined) normalized.city = req.body.city;
    if (req.body.state !== undefined) normalized.state = req.body.state;
    if (req.body.pinCode !== undefined) normalized.pinCode = req.body.pinCode;
    if (req.body.buildingType !== undefined && req.body.buildingType !== null) {
      // safe lowercasing only when value exists
      normalized.buildingType = String(req.body.buildingType).toLowerCase();
    }
    if (req.body.status !== undefined) normalized.status = req.body.status;

    // numeric normalization (only set when provided)
    if (req.body.totalBlocks !== undefined) {
      const tb = Number(req.body.totalBlocks);
      normalized.totalBlocks = Number.isNaN(tb) ? 0 : tb;
    }
    if (req.body.totalUnits !== undefined) {
      const tu = Number(req.body.totalUnits);
      normalized.totalUnits = Number.isNaN(tu) ? 0 : tu;
    }

    // set updatedBy
    normalized.updatedBy = userId;

    // If normalized.society exists but no ref, prefer explicit societyId or param id
    if (normalized.society && !normalized.society.ref && societyRefForCreate) {
      normalized.society.ref = societyRefForCreate;
    }

    // TRY to update assuming :id is a building id
    let updated = null;
    if (paramId && mongoose.Types.ObjectId.isValid(paramId)) {
      updated = await buildingModel.findByIdAndUpdate(paramId, normalized, {
        new: true,
        runValidators: true,
        context: "query",
      });
    }

    if (updated) {
      // updated existing building
      return res.status(200).json(updated);
    }

    // NOT FOUND: create a new building using payload + fallbacks from raw body
    // Prepare the create payload carefully (avoid calling .toLowerCase() on undefined)
    const payloadForCreate = {
      society: normalized.society || undefined,
      buildingName: normalized.buildingName ?? req.body.buildingName,
      address: normalized.address ?? req.body.address,
      territory: normalized.territory ?? req.body.territory,
      city: normalized.city ?? req.body.city,
      state: normalized.state ?? req.body.state,
      pinCode: normalized.pinCode ?? req.body.pinCode,
      totalBlocks:
        normalized.totalBlocks ??
        (req.body.totalBlocks !== undefined ? Number(req.body.totalBlocks) : 0),
      totalUnits:
        normalized.totalUnits ??
        (req.body.totalUnits !== undefined ? Number(req.body.totalUnits) : 0),
      buildingType:
        normalized.buildingType ??
        (req.body.buildingType !== undefined && req.body.buildingType !== null
          ? String(req.body.buildingType).toLowerCase()
          : undefined),
      status: normalized.status ?? req.body.status ?? "active",
      createdBy: userId,
      updatedBy: userId,
    };

    // ensure society.ref is set (prefer explicit body.societyId, then param id)
    if (!payloadForCreate.society) payloadForCreate.society = {};
    if (!payloadForCreate.society.ref && societyRefForCreate) {
      if (!mongoose.Types.ObjectId.isValid(String(societyRefForCreate))) {
        // optional: you can either throw or ignore; we'll include it but not validate here
        // throwing would prevent accidental bad refs
      }
      payloadForCreate.society.ref = societyRefForCreate;
    }

    // If society.ref still missing, you might want to reject creation
    if (!payloadForCreate.society.ref) {
      return res.status(400).json({ message: "Missing society id (provide societyId or use :id)" });
    }

    const created = await buildingModel.create(payloadForCreate);
    return res.status(201).json(created);
  } catch (err) {
    // duplicate key
    if (err && err.code === 11000) {
      return res.status(409).json({ message: "Duplicate key error", error: err.keyValue || err });
    }
    // validation / other errors
    next(err);
  }
};

// Soft delete (set status inactive) or hard delete if query param hard=true
exports.delete = async (req, res, next) => {
  try {
    const id = req.params.id;
    const hard = req.query.hard === "true";

    if (hard) {
      const removed = await buildingModel.findByIdAndDelete(id);
      if (!removed) return res.status(404).json({ message: "Building not found" });
      return res.json({ message: "Building permanently deleted" });
    } else {
      const updated = await buildingModel.findByIdAndUpdate(
        id,
        { status: "inactive" },
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: "Building not found" });
      return res.json({ message: "Building deactivated", building: updated });
    }
  } catch (err) {
    next(err);
  }
};
