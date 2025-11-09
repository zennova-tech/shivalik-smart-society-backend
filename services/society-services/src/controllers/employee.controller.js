// controllers/employee.controller.js
const { validationResult } = require("express-validator");
const path = require("path");
const Employee = require("../models/employee.model");
const { UPLOAD_DIR } = require("../middleware/upload");

/* helper to build file URL (local) */
function fileUrlFor(file) {
  if (!file) return null;
  // return path relative to server (adjust for your static server)
  return `/uploads/${path.basename(file.path)}`;
}

exports.create = async (req, res, next) => {
  try {
    const userId = (req.user && req.user._id) || "690f738ef35f6b855a7b7746";
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // files provided by multer: req.files (fields)
    const idProofFile = req.files && req.files.idProof ? req.files.idProof[0] : null;
    const policeFile =
      req.files && req.files.policeVerification ? req.files.policeVerification[0] : null;

    const payload = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      countryCode: req.body.countryCode || "+91",
      mobileNumber: req.body.mobileNumber,
      email: req.body.email,
      employeeType: req.body.employeeType,
      idProofUrl: req.body.idProofUrl || fileUrlFor(idProofFile),
      policeVerificationUrl: req.body.policeVerificationUrl || fileUrlFor(policeFile),
      society: req.body.society,
      building: req.body.building,
      block: req.body.block,
      status: req.body.status || "active",
      createdBy: userId,
    };

    const created = await Employee.create(payload);
    return res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate record", duplicate: err.keyValue || {} });
    }
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const userId = (req.user && req.user._id) || "690f738ef35f6b855a7b7746";

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const idProofFile = req.files && req.files.idProof ? req.files.idProof[0] : null;
    const policeFile =
      req.files && req.files.policeVerification ? req.files.policeVerification[0] : null;

    const update = {
      ...(req.body.firstName !== undefined && { firstName: req.body.firstName }),
      ...(req.body.lastName !== undefined && { lastName: req.body.lastName }),
      ...(req.body.countryCode !== undefined && { countryCode: req.body.countryCode }),
      ...(req.body.mobileNumber !== undefined && { mobileNumber: req.body.mobileNumber }),
      ...(req.body.email !== undefined && { email: req.body.email }),
      ...(req.body.employeeType !== undefined && { employeeType: req.body.employeeType }),
      ...(req.body.society !== undefined && { society: req.body.society }),
      ...(req.body.building !== undefined && { building: req.body.building }),
      ...(req.body.block !== undefined && { block: req.body.block }),
      ...(req.body.status !== undefined && { status: req.body.status }),
      updatedBy: userId,
    };

    if (idProofFile) update.idProofUrl = fileUrlFor(idProofFile);
    if (policeFile) update.policeVerificationUrl = fileUrlFor(policeFile);

    const updated = await Employee.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Employee not found" });
    return res.json(updated);
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: "Duplicate record", duplicate: err.keyValue });
    next(err);
  }
};

/* other handlers (list, getById, remove) - same as previous implementation */
exports.list = async (req, res, next) => {
  try {
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
    if (req.query.employeeType) filter.employeeType = req.query.employeeType;

    const projection = {
      firstName: 1,
      lastName: 1,
      countryCode: 1,
      mobileNumber: 1,
      email: 1,
      employeeType: 1,
      status: 1,
      building: 1,
      block: 1,
      createdAt: 1,
    };

    const [items, total] = await Promise.all([
      Employee.find(filter, projection)
        .populate("building", "buildingName")
        .populate("block", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Employee.countDocuments(filter),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const doc = await Employee.findById(req.params.id)
      .populate("building block createdBy updatedBy", "buildingName name firstName lastName")
      .lean();
    if (!doc) return res.status(404).json({ message: "Employee not found" });
    return res.json(doc);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const id = req.params.id;
    const hard = req.query.hard === "true";

    if (hard) {
      const removed = await Employee.findByIdAndDelete(id);
      if (!removed) return res.status(404).json({ message: "Employee not found" });
      return res.json({ message: "Employee permanently deleted" });
    } else {
      const updated = await Employee.findByIdAndUpdate(id, { status: "inactive" }, { new: true });
      if (!updated) return res.status(404).json({ message: "Employee not found" });
      return res.json({ message: "Employee deactivated", employee: updated });
    }
  } catch (err) {
    next(err);
  }
};
