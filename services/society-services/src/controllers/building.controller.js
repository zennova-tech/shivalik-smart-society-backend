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
      buildingType: req.body.buildingType,
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
    const id = req.params.id;
    const userId = (req.user && req.user._id) || "000000000000000000000000";

    // Build normalized payload similar to create()
    const normalized = {};

    if (req.body.society) {
      normalized.society = {
        name: req.body.society.name ?? undefined,
        logo: req.body.society.logo ?? undefined,
        ref: req.body.society.ref ?? undefined,
      };
    }

    if (req.body.buildingName !== undefined) normalized.buildingName = req.body.buildingName;
    if (req.body.address !== undefined) normalized.address = req.body.address;
    if (req.body.territory !== undefined) normalized.territory = req.body.territory;
    if (req.body.city !== undefined) normalized.city = req.body.city;
    if (req.body.state !== undefined) normalized.state = req.body.state;
    if (req.body.pinCode !== undefined) normalized.pinCode = req.body.pinCode;
    if (req.body.buildingType !== undefined) normalized.buildingType = req.body.buildingType;
    if (req.body.status !== undefined) normalized.status = req.body.status;

    // numeric normalization (only set when provided)
    if (req.body.totalBlocks !== undefined) {
      const tb = Number(req.body.totalBlocks);
      if (!Number.isNaN(tb)) normalized.totalBlocks = tb;
      else normalized.totalBlocks = 0;
    }
    if (req.body.totalUnits !== undefined) {
      const tu = Number(req.body.totalUnits);
      if (!Number.isNaN(tu)) normalized.totalUnits = tu;
      else normalized.totalUnits = 0;
    }

    // set updatedBy
    normalized.updatedBy = userId;

    // Attempt update first
    const updated = await buildingModel.findByIdAndUpdate(id, normalized, {
      new: true,
      runValidators: true,
      context: "query",
    });

    if (updated) {
      // Successfully updated existing building
      return res.status(200).json(updated);
    }

    // If not found => create a new building (use same normalized payload but set createdBy)
    const payloadForCreate = {
      // include society if present (already normalized)
      society: normalized.society || undefined,

      // top-level fields -- prefer values from normalized, but fall back to raw body if needed
      buildingName: normalized.buildingName ?? req.body.buildingName,
      address: normalized.address ?? req.body.address,
      territory: normalized.territory ?? req.body.territory,
      city: normalized.city ?? req.body.city,
      state: normalized.state ?? req.body.state,
      pinCode: normalized.pinCode ?? req.body.pinCode,
      totalBlocks: normalized.totalBlocks ?? Number(req.body.totalBlocks ?? 0),
      totalUnits: normalized.totalUnits ?? Number(req.body.totalUnits ?? 0),
      buildingType: normalized.buildingType ?? req.body.buildingType,
      status: normalized.status ?? req.body.status ?? "active",

      createdBy: userId,
    };

    // Create new document
    const created = await buildingModel.create(payloadForCreate);
    return res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate key error" });
    }
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
