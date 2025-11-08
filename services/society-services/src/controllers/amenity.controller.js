const Amenity = require("../models/amenity.model");

/* Create amenity */
exports.create = async (req, res, next) => {
  try {
    const userId = (req.user && req.user._id) || "690f738ef35f6b855a7b7746";
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const payload = {
      name: req.body.name,
      description: req.body.description,
      capacity: req.body.capacity ?? 1,
      amenityType: req.body.amenityType ?? "free",
      photoUrl: req.body.photoUrl,
      bookingType: req.body.bookingType ?? "one_time",
      slots: Array.isArray(req.body.slots) ? req.body.slots : [],
      advanceBookingDays: req.body.advanceBookingDays ?? 0,
      building: req.body.building,
      block: req.body.block,
      status: req.body.status ?? "available",
      createdBy: userId,
    };

    const created = await Amenity.create(payload);
    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

/* List amenities */
exports.list = async (req, res, next) => {
  try {
    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const rawLimit = req.query.limit ? Number(req.query.limit) : 20;
    const limit = Math.min(Math.max(1, rawLimit), 200);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.q) filter.$text = { $search: req.query.q };
    if (req.query.building) filter.building = req.query.building;
    if (req.query.block) filter.block = req.query.block;
    if (req.query.status) filter.status = req.query.status;

    const projection = {
      name: 1,
      description: 1,
      amenityType: 1,
      capacity: 1,
      bookingType: 1,
      slots: 1,
      status: 1,
      createdAt: 1,
    };

    const [items, total] = await Promise.all([
      Amenity.find(filter, projection)
        .populate("building", "buildingName")
        .populate("block", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Amenity.countDocuments(filter),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error("Amenity.list error:", err);
    next(err);
  }
};

/* Get by id */
exports.getById = async (req, res, next) => {
  try {
    const doc = await Amenity.findById(req.params.id)
      .populate("building block createdBy updatedBy", "buildingName name firstName lastName")
      .lean();
    if (!doc) return res.status(404).json({ message: "Amenity not found" });
    return res.json(doc);
  } catch (err) {
    next(err);
  }
};

/* Update amenity */
exports.update = async (req, res, next) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const update = {
      ...(req.body.name !== undefined && { name: req.body.name }),
      ...(req.body.description !== undefined && { description: req.body.description }),
      ...(req.body.capacity !== undefined && { capacity: req.body.capacity }),
      ...(req.body.amenityType !== undefined && { amenityType: req.body.amenityType }),
      ...(req.body.photoUrl !== undefined && { photoUrl: req.body.photoUrl }),
      ...(req.body.bookingType !== undefined && { bookingType: req.body.bookingType }),
      ...(Array.isArray(req.body.slots) && { slots: req.body.slots }),
      ...(req.body.advanceBookingDays !== undefined && {
        advanceBookingDays: req.body.advanceBookingDays,
      }),
      ...(req.body.building !== undefined && { building: req.body.building }),
      ...(req.body.block !== undefined && { block: req.body.block }),
      ...(req.body.status !== undefined && { status: req.body.status }),
      updatedBy: userId,
    };

    const updated = await Amenity.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Amenity not found" });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
};

/* Add a slot to amenity (slot-based booking) */
exports.addSlot = async (req, res, next) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { startTime, endTime, capacity } = req.body;
    const amenityId = req.params.id;

    // simple sanity: start < end if parseable HH:mm
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    if (sh > eh || (sh === eh && sm >= em)) {
      return res.status(400).json({ message: "startTime must be before endTime" });
    }

    const amenity = await Amenity.findById(amenityId);
    if (!amenity) return res.status(404).json({ message: "Amenity not found" });

    amenity.slots.push({ startTime, endTime, capacity: capacity ?? 1 });
    amenity.updatedBy = userId;
    await amenity.save();
    return res.status(201).json(amenity);
  } catch (err) {
    next(err);
  }
};

/* Remove a slot by slot id */
exports.removeSlot = async (req, res, next) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const amenityId = req.params.id;
    const slotId = req.params.slotId;

    const amenity = await Amenity.findById(amenityId);
    if (!amenity) return res.status(404).json({ message: "Amenity not found" });

    const before = amenity.slots.length;
    amenity.slots = amenity.slots.filter((s) => s._id.toString() !== slotId);
    if (amenity.slots.length === before) return res.status(404).json({ message: "Slot not found" });

    amenity.updatedBy = userId;
    await amenity.save();
    return res.json({ message: "Slot removed", amenity });
  } catch (err) {
    next(err);
  }
};

/* Delete (soft by default) */
exports.remove = async (req, res, next) => {
  try {
    const id = req.params.id;
    const hard = req.query.hard === "true";
    if (hard) {
      const removed = await Amenity.findByIdAndDelete(id);
      if (!removed) return res.status(404).json({ message: "Amenity not found" });
      return res.json({ message: "Amenity permanently deleted" });
    } else {
      const updated = await Amenity.findByIdAndUpdate(id, { status: "archived" }, { new: true });
      if (!updated) return res.status(404).json({ message: "Amenity not found" });
      return res.json({ message: "Amenity archived", amenity: updated });
    }
  } catch (err) {
    next(err);
  }
};
