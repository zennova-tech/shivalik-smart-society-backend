// controllers/committeeMember.controller.js
const { validationResult } = require("express-validator");
const CommitteeMember = require("../models/committee.member.model");

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
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      countryCode: req.body.countryCode || "+91",
      mobileNumber: req.body.mobileNumber,
      email: req.body.email,
      memberType: req.body.memberType || "member",
      society: req.body.society,
      building: req.body.building,
      block: req.body.block,
      status: req.body.status || "active",
      createdBy: userId,
    };

    const created = await CommitteeMember.create(payload);
    return res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate record", duplicate: err.keyValue || {} });
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
    if (req.query.q) {
      filter.$or = [
        { firstName: { $regex: req.query.q, $options: "i" } },
        { lastName: { $regex: req.query.q, $options: "i" } },
        { email: { $regex: req.query.q, $options: "i" } },
        { mobileNumber: { $regex: req.query.q, $options: "i" } },
      ];
    }
    if (req.query.society) filter.society = req.query.society;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.memberType) filter.memberType = req.query.memberType;

    const projection = {
      firstName: 1,
      lastName: 1,
      countryCode: 1,
      mobileNumber: 1,
      email: 1,
      memberType: 1,
      status: 1,
      building: 1,
      block: 1,
      createdAt: 1,
    };

    const [items, total] = await Promise.all([
      CommitteeMember.find(filter, projection)
        .populate("building", "buildingName")
        .populate("block", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CommitteeMember.countDocuments(filter),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error("CommitteeMember.list error:", err);
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    if (handleValidation(req, res)) return;
    const doc = await CommitteeMember.findById(req.params.id)
      .populate("building block createdBy updatedBy", "buildingName name firstName lastName")
      .lean();
    if (!doc) return res.status(404).json({ message: "Committee member not found" });
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
      ...(req.body.firstName !== undefined && { firstName: req.body.firstName }),
      ...(req.body.lastName !== undefined && { lastName: req.body.lastName }),
      ...(req.body.countryCode !== undefined && { countryCode: req.body.countryCode }),
      ...(req.body.mobileNumber !== undefined && { mobileNumber: req.body.mobileNumber }),
      ...(req.body.email !== undefined && { email: req.body.email }),
      ...(req.body.memberType !== undefined && { memberType: req.body.memberType }),
      ...(req.body.society !== undefined && { society: req.body.society }),
      ...(req.body.building !== undefined && { building: req.body.building }),
      ...(req.body.block !== undefined && { block: req.body.block }),
      ...(req.body.status !== undefined && { status: req.body.status }),
      updatedBy: userId,
    };

    const updated = await CommitteeMember.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Committee member not found" });
    return res.json(updated);
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: "Duplicate record", duplicate: err.keyValue });
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    if (handleValidation(req, res)) return;
    const id = req.params.id;
    const hard = req.query.hard === "true";

    if (hard) {
      const removed = await CommitteeMember.findByIdAndDelete(id);
      if (!removed) return res.status(404).json({ message: "Committee member not found" });
      return res.json({ message: "Committee member permanently deleted" });
    } else {
      const updated = await CommitteeMember.findByIdAndUpdate(
        id,
        { status: "archived" },
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: "Committee member not found" });
      return res.json({ message: "Committee member archived", committeeMember: updated });
    }
  } catch (err) {
    next(err);
  }
};
