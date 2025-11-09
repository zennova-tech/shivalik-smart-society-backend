const mongoose = require("mongoose");
const Service = require("../models/service.model"); // adjust path as needed

// Helper: validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create service
exports.create = async (req, res, next) => {
  try {
    const payload = {
      serviceName: req.body.serviceName,
      description: req.body.description,
      vendorName: req.body.vendorName,
      mobileNumber: req.body.mobileNumber,
      email: req.body.email,
      isActive: typeof req.body.isActive === "boolean" ? req.body.isActive : true,
      createdBy: req.user?.id, // optional, if you use auth middleware
    };

    const service = new Service(payload);
    await service.save();

    res.status(201).json({ status: true, data: service });
  } catch (err) {
    // Mongoose validation error handling
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ status: false, message: errors.join(", ") });
    }
    next(err);
  }
};

// Get list with pagination, search, filter
exports.list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, parseInt(req.query.limit || "20", 10));
    const skip = (page - 1) * limit;

    const search = req.query.search?.trim();
    const isActive = req.query.isActive;
    const filters = { isDeleted: false };

    if (typeof isActive !== "undefined") {
      if (isActive === "true" || isActive === "false") {
        filters.isActive = isActive === "true";
      }
    }

    if (search) {
      // text-like search across serviceName, vendorName, email
      filters.$or = [
        { serviceName: new RegExp(search, "i") },
        { vendorName: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];
    }

    const [data, total] = await Promise.all([
      Service.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Service.countDocuments(filters),
    ]);

    res.json({
      status: true,
      data,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get single service by id
exports.getById = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ status: false, message: "Invalid id" });

    const service = await Service.findOne({ _id: id, isDeleted: false }).lean();
    if (!service) return res.status(404).json({ status: false, message: "Service not found" });

    res.json({ status: true, data: service });
  } catch (err) {
    next(err);
  }
};

// Update service
exports.update = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ status: false, message: "Invalid id" });

    const updateFields = {};
    ["serviceName", "description", "vendorName", "mobileNumber", "email", "isActive"].forEach(
      (k) => {
        if (typeof req.body[k] !== "undefined") updateFields[k] = req.body[k];
      }
    );

    const updated = await Service.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ status: false, message: "Service not found" });

    res.json({ status: true, data: updated });
  } catch (err) {
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ status: false, message: errors.join(", ") });
    }
    next(err);
  }
};

// Soft-delete service
exports.remove = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ status: false, message: "Invalid id" });

    const removed = await Service.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, isActive: false } },
      { new: true }
    );

    if (!removed)
      return res
        .status(404)
        .json({ status: false, message: "Service not found or already deleted" });

    res.json({ status: true, message: "Service deleted", data: removed });
  } catch (err) {
    next(err);
  }
};

// Toggle active / inactive
exports.toggleActive = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ status: false, message: "Invalid id" });

    const service = await Service.findOne({ _id: id, isDeleted: false });
    if (!service) return res.status(404).json({ status: false, message: "Service not found" });

    service.isActive = !service.isActive;
    await service.save();

    res.json({ status: true, data: service });
  } catch (err) {
    next(err);
  }
};
