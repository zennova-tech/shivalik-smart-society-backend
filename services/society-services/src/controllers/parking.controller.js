const Parking = require("../models/parking.model");

exports.create = async (req, res, next) => {
  try {
    const userId = (req.user && req.user._id) || "690f738ef35f6b855a7b7746";
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const payload = {
      name: req.body.name,
      memberCarSlots: req.body.memberCarSlots ?? 0,
      memberBikeSlots: req.body.memberBikeSlots ?? 0,
      visitorCarSlots: req.body.visitorCarSlots ?? 0,
      visitorBikeSlots: req.body.visitorBikeSlots ?? 0,
      block: req.body.block,
      building: req.body.building,
      status: req.body.status || "active",
      createdBy: userId,
    };

    const created = await Parking.create(payload);
    return res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000)
      return res
        .status(409)
        .json({ message: "Parking with this name already exists for the building" });
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const rawLimit = req.query.limit ? Number(req.query.limit) : 20;
    const limit = Math.min(Math.max(1, rawLimit), 200);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.q) filter.name = { $regex: req.query.q, $options: "i" };
    if (req.query.building) filter.building = req.query.building;
    if (req.query.block) filter.block = req.query.block;
    if (req.query.status) filter.status = req.query.status;

    const projection = {
      name: 1,
      memberCarSlots: 1,
      memberBikeSlots: 1,
      visitorCarSlots: 1,
      visitorBikeSlots: 1,
      block: 1,
      building: 1,
      status: 1,
      createdAt: 1,
    };

    const [items, total] = await Promise.all([
      Parking.find(filter, projection)
        .populate("block", "name")
        .populate("building", "buildingName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Parking.countDocuments(filter),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error("Parking.list error:", err);
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const doc = await Parking.findById(req.params.id)
      .populate("block building createdBy updatedBy", "name buildingName firstName lastName")
      .lean();
    if (!doc) return res.status(404).json({ message: "Parking not found" });
    return res.json(doc);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const update = {
      ...(req.body.name !== undefined && { name: req.body.name }),
      ...(req.body.memberCarSlots !== undefined && { memberCarSlots: req.body.memberCarSlots }),
      ...(req.body.memberBikeSlots !== undefined && { memberBikeSlots: req.body.memberBikeSlots }),
      ...(req.body.visitorCarSlots !== undefined && { visitorCarSlots: req.body.visitorCarSlots }),
      ...(req.body.visitorBikeSlots !== undefined && {
        visitorBikeSlots: req.body.visitorBikeSlots,
      }),
      ...(req.body.block !== undefined && { block: req.body.block }),
      ...(req.body.building !== undefined && { building: req.body.building }),
      ...(req.body.status !== undefined && { status: req.body.status }),
      updatedBy: userId,
    };

    const updated = await Parking.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Parking not found" });
    return res.json(updated);
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: "Duplicate parking name for the building" });
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const id = req.params.id;
    const hard = req.query.hard === "true";
    if (hard) {
      const removed = await Parking.findByIdAndDelete(id);
      if (!removed) return res.status(404).json({ message: "Parking not found" });
      return res.json({ message: "Parking permanently deleted" });
    } else {
      const updated = await Parking.findByIdAndUpdate(id, { status: "inactive" }, { new: true });
      if (!updated) return res.status(404).json({ message: "Parking not found" });
      return res.json({ message: "Parking deactivated", parking: updated });
    }
  } catch (err) {
    next(err);
  }
};
