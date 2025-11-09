// controllers/complaint.controller.js
const { validationResult } = require("express-validator");
const path = require("path");
const Complaint = require("../models/complaint.model");
const { UPLOAD_DIR } = require("../middleware/uploadComplaints");

function handleValidation(req, res) {
  const errs = validationResult(req);
  if (!errs.isEmpty()) {
    res.status(422).json({ errors: errs.array() });
    return true;
  }
  return false;
}

function fileUrlFor(filePath) {
  if (!filePath) return null;
  return `/uploads/complaints/${path.basename(filePath)}`;
}

/* Create complaint (supports images[] and audio single file) */
exports.create = async (req, res, next) => {
  try {
    if (handleValidation(req, res)) return;
    const userId = (req.user && req.user._id) || "690f738ef35f6b855a7b7746";
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // files: req.files.images (array), req.files.audio (array with one)
    const imagesFiles = (req.files && req.files.images) || [];
    const audioFiles = (req.files && req.files.audio) || [];

    const images = imagesFiles.map((f) => fileUrlFor(f.path));
    const audioUrl = audioFiles.length ? fileUrlFor(audioFiles[0].path) : undefined;

    const complaint = await Complaint.create({
      category: req.body.category,
      location: req.body.location,
      priority: req.body.priority || "medium",
      description: req.body.description,
      images,
      audioUrl,
      createdBy: userId,
    });

    return res.status(201).json(complaint);
  } catch (err) {
    next(err);
  }
};

/* List (paginated, filters) */
exports.list = async (req, res, next) => {
  try {
    if (handleValidation(req, res)) return;

    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const rawLimit = req.query.limit ? Number(req.query.limit) : 20;
    const limit = Math.min(Math.max(1, rawLimit), 200);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.q) filter.$text = { $search: req.query.q }; // optional: requires text index

    const [items, total] = await Promise.all([
      Complaint.find(filter)
        .populate("createdBy", "firstName lastName email")
        .populate("assignedTo", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Complaint.countDocuments(filter),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
};

/* Get by id */
exports.getById = async (req, res, next) => {
  try {
    if (handleValidation(req, res)) return;
    const doc = await Complaint.findById(req.params.id)
      .populate("createdBy", "firstName lastName email")
      .populate("assignedTo", "firstName lastName")
      .lean();
    if (!doc) return res.status(404).json({ message: "Complaint not found" });
    return res.json(doc);
  } catch (err) {
    next(err);
  }
};

/* Update complaint (status, assignedTo, description edits etc.) */
exports.update = async (req, res, next) => {
  try {
    if (handleValidation(req, res)) return;
    const userId = (req.user && req.user._id) || "690f738ef35f6b855a7b7746";

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const update = {
      ...(req.body.category !== undefined && { category: req.body.category }),
      ...(req.body.location !== undefined && { location: req.body.location }),
      ...(req.body.priority !== undefined && { priority: req.body.priority }),
      ...(req.body.description !== undefined && { description: req.body.description }),
      ...(req.body.status !== undefined && { status: req.body.status }),
      ...(req.body.assignedTo !== undefined && { assignedTo: req.body.assignedTo }),
      ...(req.body.resolvedAt !== undefined && { resolvedAt: req.body.resolvedAt }),
    };

    const updated = await Complaint.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Complaint not found" });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
};

/* Add comment */
exports.addComment = async (req, res, next) => {
  try {
    if (handleValidation(req, res)) return;
    const userId = (req.user && req.user._id) || "690f738ef35f6b855a7b7746";

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { comment } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    complaint.comments.push({ comment, commentedBy: userId });
    await complaint.save();
    return res.status(201).json(complaint);
  } catch (err) {
    next(err);
  }
};

/* Append more files (images/audio) to existing complaint */
exports.appendFiles = async (req, res, next) => {
  try {
    if (handleValidation(req, res)) return;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    const imagesFiles = (req.files && req.files.images) || [];
    const audioFiles = (req.files && req.files.audio) || [];

    const newImages = imagesFiles.map((f) => fileUrlFor(f.path));
    complaint.images = (complaint.images || []).concat(newImages);

    if (audioFiles.length) {
      // replace or keep first audio (decision: we replace)
      complaint.audioUrl = fileUrlFor(audioFiles[0].path);
    }

    await complaint.save();
    return res.json(complaint);
  } catch (err) {
    next(err);
  }
};

/* Soft delete (archive) or hard delete */
exports.remove = async (req, res, next) => {
  try {
    if (handleValidation(req, res)) return;
    const hard = req.query.hard === "true";
    if (hard) {
      const removed = await Complaint.findByIdAndDelete(req.params.id);
      if (!removed) return res.status(404).json({ message: "Complaint not found" });
      return res.json({ message: "Complaint permanently deleted" });
    } else {
      const updated = await Complaint.findByIdAndUpdate(
        req.params.id,
        { status: "archived" },
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: "Complaint not found" });
      return res.json({ message: "Complaint archived", complaint: updated });
    }
  } catch (err) {
    next(err);
  }
};
