const Block = require("../models/block.model");

exports.create = async (req, res, next) => {
  try {
    // auth middleware must set req.user._id
    // const userId = req.user && req.user._id;
    // if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const payload = {
      name: req.body.name,
      building: req.body.building || undefined,
      status: req.body.status || "active",
      createdBy: "690f738ef35f6b855a7b7746",
    };

    const created = await Block.create(payload);
    return res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000)
      return res
        .status(409)
        .json({ message: "Block with this name already exists for the building" });
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
    if (q) filter.name = { $regex: q, $options: "i" };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.building) filter.building = req.query.building;

    const [items, total] = await Promise.all([
      Block.find(filter)
        .populate("createdBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Block.countDocuments(filter),
    ]);

    return res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const doc = await Block.findById(req.params.id)
      .populate("createdBy updatedBy", "firstName lastName email")
      .lean();
    if (!doc) return res.status(404).json({ message: "Block not found" });
    return res.json(doc);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const userId = (req.user && req.user._id) || "690f738ef35f6b855a7b7746";
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const update = {
      ...(req.body.name !== undefined && { name: req.body.name }),
      ...(req.body.building !== undefined && { building: req.body.building }),
      ...(req.body.status !== undefined && { status: req.body.status }),
      updatedBy: userId,
    };

    const updated = await Block.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Block not found" });
    return res.json(updated);
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: "Duplicate block name for the building" });
    next(err);
  }
};

// remove -> soft delete by default; hard delete if ?hard=true
exports.remove = async (req, res, next) => {
  try {
    const id = req.params.id;
    const hard = req.query.hard === "true";

    if (hard) {
      const removed = await Block.findByIdAndDelete(id);
      if (!removed) return res.status(404).json({ message: "Block not found" });
      return res.json({ message: "Block permanently deleted" });
    } else {
      const updated = await Block.findByIdAndUpdate(id, { status: "inactive" }, { new: true });
      if (!updated) return res.status(404).json({ message: "Block not found" });
      return res.json({ message: "Block deactivated", block: updated });
    }
  } catch (err) {
    next(err);
  }
};
