// controllers/unit.controller.js
const { validationResult } = require("express-validator");
const Unit = require("../models/unit.model");

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return true;
  }
  return false;
}

exports.create = async (req, res, next) => {
  try {
    if (handleValidation(req, res)) return;
    const userId = (req.user && req.user._id) || "690f738ef35f6b855a7b7746";
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const payload = {
      block: req.body.block,
      floor: req.body.floor,
      unitNumber: req.body.unitNumber,
      unitType: req.body.unitType,
      areaSqFt: req.body.areaSqFt,
      status: req.body.status || "vacant",
      owner: req.body.owner,
      createdBy: userId,
    };

    const created = await Unit.create(payload);
    return res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Unit number already exists for this floor" });
    }
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    if (handleValidation(req, res)) return;

    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const rawLimit = req.query.limit ? Number(req.query.limit) : 20;
    const limit = Math.min(Math.max(1, rawLimit), 200);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.q) filter.unitNumber = { $regex: req.query.q, $options: "i" };
    if (req.query.block) filter.block = req.query.block;
    if (req.query.floor) filter.floor = req.query.floor;
    if (req.query.status) filter.status = req.query.status;

    const projection = {
      unitNumber: 1,
      unitType: 1,
      areaSqFt: 1,
      status: 1,
      block: 1,
      floor: 1,
      owner: 1,
      createdAt: 1,
    };

    const [items, total] = await Promise.all([
      Unit.find(filter, projection)
        .populate("block", "name")
        .populate("floor", "name number")
        .populate("owner", "firstName lastName")
        .sort({ unitNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Unit.countDocuments(filter),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error("Unit.list error:", err);
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    if (handleValidation(req, res)) return;
    const doc = await Unit.findById(req.params.id)
      .populate("block floor owner createdBy updatedBy", "name unitNumber firstName lastName")
      .lean();
    if (!doc) return res.status(404).json({ message: "Unit not found" });
    return res.json(doc);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    if (handleValidation(req, res)) return;
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const update = {
      ...(req.body.block !== undefined && { block: req.body.block }),
      ...(req.body.floor !== undefined && { floor: req.body.floor }),
      ...(req.body.unitNumber !== undefined && { unitNumber: req.body.unitNumber }),
      ...(req.body.unitType !== undefined && { unitType: req.body.unitType }),
      ...(req.body.areaSqFt !== undefined && { areaSqFt: req.body.areaSqFt }),
      ...(req.body.status !== undefined && { status: req.body.status }),
      ...(req.body.owner !== undefined && { owner: req.body.owner }),
      updatedBy: userId,
    };

    const updated = await Unit.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Unit not found" });
    return res.json(updated);
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: "Unit number already exists for this floor" });
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    if (handleValidation(req, res)) return;

    const id = req.params.id;
    const hard = req.query.hard === "true";

    if (hard) {
      const removed = await Unit.findByIdAndDelete(id);
      if (!removed) return res.status(404).json({ message: "Unit not found" });
      return res.json({ message: "Unit permanently deleted" });
    } else {
      const updated = await Unit.findByIdAndUpdate(id, { status: "blocked" }, { new: true });
      if (!updated) return res.status(404).json({ message: "Unit not found" });
      return res.json({ message: "Unit blocked (soft delete)", unit: updated });
    }
  } catch (err) {
    next(err);
  }
};
