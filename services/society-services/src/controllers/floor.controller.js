// controllers/floor.controller.js
const Floor = require("../models/floor.model");

/** Create single floor */
exports.create = async (req, res, next) => {
  try {
    // const userId = req.user && req.user._id;
    // if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const payload = {
      name: req.body.name,
      number: Number(req.body.number),
      block: req.body.block,
      building: req.body.building || undefined,
      status: req.body.status || "active",
      createdBy: "690f738ef35f6b855a7b7746",
    };

    const created = await Floor.create(payload);
    return res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Floor number or name already exists for this block",
        error: err.keyValue,
      });
    }
    next(err);
  }
};

/** Batch create floors from range (e.g., start 1 to end 10) */
exports.batchCreate = async (req, res, next) => {
  try {
    const { block, building, prefix, startNumber, endNumber } = req.body;

    if (!block) return res.status(400).json({ message: "block is required" });
    if (!prefix) return res.status(400).json({ message: "prefix is required" });
    const start = Number(startNumber);
    const end = Number(endNumber);
    if (Number.isNaN(start) || Number.isNaN(end)) {
      return res.status(400).json({ message: "startNumber and endNumber must be integers" });
    }
    if (start > end) return res.status(400).json({ message: "startNumber must be <= endNumber" });

    // Use req.user._id if available, otherwise fallback to a test id (remove fallback in production)
    const userId = (req.user && req.user._id) || "690f738ef35f6b855a7b7746";

    const docs = [];
    for (let n = start; n <= end; n++) {
      docs.push({
        name: `${prefix} ${n}`,
        number: n,
        block,
        building: building || undefined,
        status: "active",
        createdBy: userId,
      });
    }

    // Try insertMany; allow duplicates to be skipped via ordered:false
    try {
      await Floor.insertMany(docs, { ordered: false });
    } catch (err) {
      // If some documents failed due to duplicates, ignore and proceed to summarise.
      // BulkWriteError typically has name 'BulkWriteError' or code 11000 on duplicate key.
      // If it's another error, rethrow.
      if (!err || (!err.writeErrors && err.code !== 11000)) {
        return next(err);
      }
      // else swallow duplicate-write errors and continue
    }

    // compute results: count how many exist now for that block in the range
    const createdCount = await Floor.countDocuments({
      block,
      number: { $gte: start, $lte: end },
    });

    const requestedCount = end - start + 1;

    // find existing numbers in the requested set (to show skipped)
    const existing = await Floor.find(
      { block, number: { $gte: start, $lte: end } },
      { number: 1, name: 1 }
    ).lean();

    const existingNumbers = existing.map((e) => e.number);

    return res.status(201).json({
      message: "Batch floor create complete",
      requested: requestedCount,
      existingCount: existingNumbers.length,
      createdCount, // same as existingCount (post-op), kept for clarity
      existingNumbers,
    });
  } catch (err) {
    // generic fallback
    next(err);
  }
};

/** List floors (pagination + filters) */
exports.list = async (req, res, next) => {
  try {
    // Pagination + safety caps
    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const rawLimit = req.query.limit ? Number(req.query.limit) : 20;
    const limit = Math.min(Math.max(1, rawLimit || 20), 200); // allow up to 200 per page
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.q) filter.name = { $regex: req.query.q, $options: "i" };
    if (req.query.block) filter.block = req.query.block;
    if (req.query.building) filter.building = req.query.building;
    if (req.query.status) filter.status = req.query.status;

    // Projection: pick only fields we need for the list to reduce payload
    const projection = {
      name: 1,
      number: 1,
      block: 1,
      building: 1,
      status: 1,
      createdAt: 1,
    };

    // Run queries in parallel
    const [items, total] = await Promise.all([
      Floor.find(filter, projection)
        .populate("block", "name") // minimal populate
        .sort({ number: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Floor.countDocuments(filter),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    // Log server error for debugging
    console.error("Error in Floor.list:", err);
    next(err);
  }
};

/** Get single floor */
exports.getById = async (req, res, next) => {
  try {
    if ((req, res)) return;
    const doc = await Floor.findById(req.params.id)
      .populate("block building createdBy updatedBy", "name")
      .lean();
    if (!doc) return res.status(404).json({ message: "Floor not found" });
    return res.json(doc);
  } catch (err) {
    next(err);
  }
};

/** Update floor */
exports.update = async (req, res, next) => {
  try {
    const userId = (req.user && req.user._id) || "690f738ef35f6b855a7b7746";
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const update = {
      ...(req.body.name !== undefined && { name: req.body.name }),
      ...(req.body.number !== undefined && { number: Number(req.body.number) }),
      ...(req.body.block !== undefined && { block: req.body.block }),
      ...(req.body.building !== undefined && { building: req.body.building }),
      ...(req.body.status !== undefined && { status: req.body.status }),
      updatedBy: userId,
    };

    const updated = await Floor.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Floor not found" });
    return res.json(updated);
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: "Duplicate floor number or name for this block" });
    next(err);
  }
};

/** Delete (soft by default, hard if ?hard=true) */
exports.remove = async (req, res, next) => {
  try {
    const id = req.params.id;
    const hard = req.query.hard === "true";

    if (hard) {
      const removed = await Floor.findByIdAndDelete(id);
      if (!removed) return res.status(404).json({ message: "Floor not found" });
      return res.json({ message: "Floor permanently deleted" });
    } else {
      const updated = await Floor.findByIdAndUpdate(id, { status: "inactive" }, { new: true });
      if (!updated) return res.status(404).json({ message: "Floor not found" });
      return res.json({ message: "Floor deactivated", floor: updated });
    }
  } catch (err) {
    next(err);
  }
};
