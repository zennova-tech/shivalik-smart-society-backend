const Notice = require("../models/notice.model");

exports.create = async (req, res, next) => {
  try {
    const userId = (req.user && req.user._id) || "690f738ef35f6b855a7b7746";
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const payload = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category || "general",
      priority: req.body.priority || "medium",
      block: req.body.block,
      unit: req.body.unit,
      publishDate: req.body.publishDate || Date.now(),
      expiryDate: req.body.expiryDate,
      status: req.body.status || "published",
      createdBy: userId,
    };

    const created = await Notice.create(payload);
    return res.status(201).json(created);
  } catch (err) {
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
    if (req.query.q) filter.$text = { $search: req.query.q };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.block) filter.block = req.query.block;
    if (req.query.unit) filter.unit = req.query.unit;
    if (req.query.priority) filter.priority = req.query.priority;

    // only show published and in-date notices optionally if client requests
    if (req.query.onlyActive === "true") {
      const now = new Date();
      filter.status = "published";
      filter.publishDate = { $lte: now };
      filter.$or = [{ expiryDate: { $exists: false } }, { expiryDate: { $gte: now } }];
    }

    const projection = {
      title: 1,
      description: 1,
      category: 1,
      priority: 1,
      block: 1,
      unit: 1,
      publishDate: 1,
      expiryDate: 1,
      status: 1,
      createdAt: 1,
    };

    const [items, total] = await Promise.all([
      Notice.find(filter, projection)
        .populate("block", "name")
        .populate("unit", "unitNumber")
        .populate("createdBy", "firstName lastName")
        .sort({ publishDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notice.countDocuments(filter),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error("Notice.list error:", err);
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const doc = await Notice.findById(req.params.id)
      .populate("block", "name")
      .populate("unit", "unitNumber")
      .populate("createdBy updatedBy", "firstName lastName")
      .lean();
    if (!doc) return res.status(404).json({ message: "Notice not found" });
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
      ...(req.body.title !== undefined && { title: req.body.title }),
      ...(req.body.description !== undefined && { description: req.body.description }),
      ...(req.body.category !== undefined && { category: req.body.category }),
      ...(req.body.priority !== undefined && { priority: req.body.priority }),
      ...(req.body.block !== undefined && { block: req.body.block }),
      ...(req.body.unit !== undefined && { unit: req.body.unit }),
      ...(req.body.publishDate !== undefined && { publishDate: req.body.publishDate }),
      ...(req.body.expiryDate !== undefined && { expiryDate: req.body.expiryDate }),
      ...(req.body.status !== undefined && { status: req.body.status }),
      updatedBy: userId,
    };

    const updated = await Notice.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Notice not found" });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const id = req.params.id;
    const hard = req.query.hard === "true";
    if (hard) {
      const removed = await Notice.findByIdAndDelete(id);
      if (!removed) return res.status(404).json({ message: "Notice not found" });
      return res.json({ message: "Notice deleted" });
    } else {
      const updated = await Notice.findByIdAndUpdate(id, { status: "archived" }, { new: true });
      if (!updated) return res.status(404).json({ message: "Notice not found" });
      return res.json({ message: "Notice archived", notice: updated });
    }
  } catch (err) {
    next(err);
  }
};
