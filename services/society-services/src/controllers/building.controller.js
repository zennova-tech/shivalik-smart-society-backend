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
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const skip = (page - 1) * limit;
    const q = req.query.q;

    const filter = {};
    if (q) {
      // simple text search on building and society name
      filter.$text = { $search: q };
    }
    // optional: only active
    if (req.query.status) filter.status = req.query.status;

    const [items, total] = await Promise.all([
      buildingModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      buildingModel.countDocuments(filter),
    ]);

    return res.json({ items, total, page: Number(page), limit: Number(limit) });
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
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const update = { ...req.body, updatedBy: userId };

    // If society object provided, normalize to nested structure
    if (req.body.society) {
      update.society = {
        name: req.body.society.name ?? undefined,
        logo: req.body.society.logo ?? undefined,
        ref: req.body.society.ref ?? undefined,
      };
    }

    const updated = await buildingModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Building not found" });
    return res.json(updated);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "Duplicate key error" });
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
