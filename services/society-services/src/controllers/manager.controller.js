// src/controllers/manager.controller.js
const mongoose = require("mongoose");
const Amenity = require("../models/amenity.model");
const Booking = require("../models/booking.model");
const Complaint = require("../models/complaint.model");
const Parking = require("../models/parking.model");
const ParkingSlot = require("../models/parkingSlot.model"); // if used
const ParkingAssignment = require("../models/parkingAssignment.model");
const Event = require("../models/event.model");
const Gallery = require("../models/gallery.model");
const Bill = require("../models/bill.model");
const Penalty = require("../models/penalty.model");
const BuildingSetting = require("../models/building.model");
const Block = require("../models/block.model");
const Unit = require("../models/unit.model");
const User = require("../models/user.model");

const { success, fail } = require("../utils/response");
const logger = require("../utils/logger");

/* ---------------- Dashboard ---------------- */
exports.dashboard = async (req, res, next) => {
  try {
    const societyId = req.user.society;
    if (!societyId) return fail(res, "User not linked to society", 400);

    // quick counts and small aggregates
    const [
      usersCount,
      amenitiesCount,
      upcomingEventsCount,
      openComplaints,
      totalUnits,
      occupiedUnits,
      bookingsThisMonth,
      pendingBills,
    ] = await Promise.all([
      User.countDocuments({ society: societyId, isDeleted: false }),
      Amenity.countDocuments({ createdBy: { $exists: true } /* optional filter */ }),
      Event.countDocuments({ society: societyId, startAt: { $gte: new Date() } }),
      Complaint.countDocuments({ society: societyId, status: { $in: ["open", "in_progress"] } }),
      Unit.countDocuments({
        floor: { $exists: true } /* approximate per society you may store society ref on unit */,
      }),
      Unit.countDocuments({ owner: { $exists: true } }),
      Booking.countDocuments({
        society: societyId,
        slotDate: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      }),
      Bill.countDocuments({ society: societyId, status: "pending" }),
    ]);

    return success(res, "Dashboard data", {
      usersCount,
      amenitiesCount,
      upcomingEventsCount,
      openComplaints,
      totalUnits,
      occupiedUnits,
      bookingsThisMonth,
      pendingBills,
    });
  } catch (err) {
    next(err);
  }
};

/* ---------------- Building Settings ---------------- */
exports.createOrUpdateBuilding = async (req, res, next) => {
  try {
    const societyId = req.user.society;
    const payload = req.body;
    if (
      !payload.buildingName ||
      !payload.address ||
      !payload.city ||
      !payload.state ||
      !payload.pinCode
    ) {
      return fail(res, "Missing required building fields", 400);
    }
    // attach society snapshot
    payload.society = payload.society || { name: req.body.societyName || "", ref: societyId };
    payload.createdBy = payload.createdBy || req.user.sub;
    // if id provided -> update
    if (req.params.id) {
      const updated = await BuildingSetting.findByIdAndUpdate(req.params.id, payload, {
        new: true,
      });
      if (!updated) return fail(res, "Building not found", 404);
      return success(res, "Building updated", updated);
    }
    const created = await BuildingSetting.create(payload);
    return success(res, "Building created", created, 201);
  } catch (err) {
    next(err);
  }
};

exports.getBuilding = async (req, res, next) => {
  try {
    const id = req.params.id;
    const doc = await BuildingSetting.findById(id);
    if (!doc) return fail(res, "Building not found", 404);
    return success(res, "Building fetched", doc);
  } catch (err) {
    next(err);
  }
};

/* ---------------- Blocks / Floors / Units ---------------- */
exports.createBlock = async (req, res, next) => {
  try {
    const payload = Object.assign({}, req.body, { createdBy: req.user.sub });
    const created = await Block.create(payload);
    return success(res, "Block created", created);
  } catch (err) {
    next(err);
  }
};

exports.createFloor = async (req, res, next) => {
  try {
    const payload = Object.assign({}, req.body, { createdBy: req.user.sub });
    const created = await require("../models/floor.model").create(payload);
    return success(res, "Floor created", created);
  } catch (err) {
    next(err);
  }
};

exports.createUnit = async (req, res, next) => {
  try {
    const payload = Object.assign({}, req.body, { createdBy: req.user.sub });
    const created = await Unit.create(payload);
    return success(res, "Unit created", created);
  } catch (err) {
    next(err);
  }
};

/* ---------------- Users ---------------- */
exports.listUsers = async (req, res, next) => {
  try {
    const societyId = req.user.society;
    const { page = 1, limit = 20, q } = req.query;
    const filter = { society: societyId, isDeleted: false };
    if (q) filter.$text = { $search: q };
    const items = await User.find(filter)
      .select("-passwordHash")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    const total = await User.countDocuments(filter);
    return success(res, "Users fetched", {
      items,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    next(err);
  }
};

/* ---------------- Bills ---------------- */
exports.createBill = async (req, res, next) => {
  try {
    const societyId = req.user.society;
    const { title, amount, dueDate, unit } = req.body;
    if (!title || !amount) return fail(res, "title and amount required", 400);
    const bill = await Bill.create({
      society: societyId,
      title,
      amount,
      dueDate,
      unit,
      createdBy: req.user.sub,
    });
    return success(res, "Bill created", bill, 201);
  } catch (err) {
    next(err);
  }
};

exports.listBills = async (req, res, next) => {
  try {
    const societyId = req.user.society;
    const { page = 1, limit = 20 } = req.query;
    const filter = { society: societyId };
    const items = await Bill.find(filter)
      .skip((page - 1) * limit)
      .limit(+limit)
      .sort({ dueDate: 1 });
    const total = await Bill.countDocuments(filter);
    return success(res, "Bills fetched", { items, total, page: +page, limit: +limit });
  } catch (err) {
    next(err);
  }
};

/* ---------------- Complaints ---------------- */
exports.createComplaint = async (req, res, next) => {
  try {
    const societyId = req.user.society;
    const payload = Object.assign({}, req.body, { society: societyId, raisedBy: req.user.sub });
    const created = await Complaint.create(payload);
    return success(res, "Complaint created", created, 201);
  } catch (err) {
    next(err);
  }
};

exports.listComplaints = async (req, res, next) => {
  try {
    const societyId = req.user.society;
    const items = await Complaint.find({ society: societyId }).sort({ createdAt: -1 }).limit(200);
    return success(res, "Complaints fetched", items);
  } catch (err) {
    next(err);
  }
};

/* ---------------- Parking ---------------- */
exports.createParking = async (req, res, next) => {
  try {
    const payload = Object.assign({}, req.body, { createdBy: req.user.sub });
    const created = await Parking.create(payload);
    return success(res, "Parking created", created, 201);
  } catch (err) {
    next(err);
  }
};

exports.createParkingSlot = async (req, res, next) => {
  try {
    const payload = Object.assign({}, req.body, {
      createdBy: req.user.sub,
      society: req.user.society,
    });
    // ParkingSlot model expected; ensure index uniqueness handled in model
    const slot = await ParkingSlot.create(payload);
    return success(res, "Parking slot created", slot, 201);
  } catch (err) {
    next(err);
  }
};

exports.assignParking = async (req, res, next) => {
  try {
    const { slotId, userId, vehicleNumber, type = "permanent", endAt = null } = req.body;
    const slot = await ParkingSlot.findById(slotId);
    if (!slot) return fail(res, "Slot not found", 404);
    // prevent assigning cross-society
    if (slot.society.toString() !== req.user.society.toString())
      return fail(res, "Invalid slot", 400);
    // create assignment
    const assign = await ParkingAssignment.create({
      society: req.user.society,
      slot: slot._id,
      user: userId,
      vehicleNumber,
      type,
      endAt,
    });
    slot.isAvailable = false;
    await slot.save();
    return success(res, "Parking assigned", assign);
  } catch (err) {
    next(err);
  }
};

/* ---------------- Events ---------------- */
exports.createEvent = async (req, res, next) => {
  try {
    const payload = Object.assign({}, req.body, {
      society: req.user.society,
      createdBy: req.user.sub,
    });
    const ev = await Event.create(payload);
    return success(res, "Event created", ev, 201);
  } catch (err) {
    next(err);
  }
};

exports.listEvents = async (req, res, next) => {
  try {
    const items = await Event.find({ society: req.user.society }).sort({ startAt: 1 }).limit(200);
    return success(res, "Events fetched", items);
  } catch (err) {
    next(err);
  }
};

/* ---------------- Gallery ---------------- */
// NOTE: handle file upload via multer -> s3, then pass image URLs in body.images
exports.addGallery = async (req, res, next) => {
  try {
    const payload = Object.assign({}, req.body, {
      society: req.user.society,
      createdBy: req.user.sub,
    });
    const g = await Gallery.create(payload);
    return success(res, "Gallery created", g, 201);
  } catch (err) {
    next(err);
  }
};

/* ---------------- Amenities & Booking ---------------- */
exports.createAmenity = async (req, res, next) => {
  try {
    const payload = Object.assign({}, req.body, { createdBy: req.user.sub });
    payload.society = req.user.society;
    const am = await Amenity.create(payload);
    return success(res, "Amenity created", am, 201);
  } catch (err) {
    next(err);
  }
};

exports.listAmenities = async (req, res, next) => {
  try {
    const items = await Amenity.find({ society: req.user.society }).sort({ createdAt: -1 });
    return success(res, "Amenities fetched", items);
  } catch (err) {
    next(err);
  }
};

/**
 * Book an amenity slot (slot-based or one-time)
 * body: { amenityId, slotDate: '2025-11-10', slotFrom: "10:00", slotTo:"11:00", price }
 */
exports.bookAmenity = async (req, res, next) => {
  try {
    const { amenityId, slotDate, slotFrom, slotTo } = req.body;
    if (!amenityId || !slotDate) return fail(res, "amenityId and slotDate required", 400);

    const amenity = await Amenity.findById(amenityId);
    if (!amenity) return fail(res, "Amenity not found", 404);
    if (amenity.society.toString() !== req.user.society.toString())
      return fail(res, "Invalid amenity for this society", 400);

    // Parse slot date (store as date without time)
    const sd = new Date(slotDate);
    sd.setHours(0, 0, 0, 0);

    // Basic concurrency check: count overlapping bookings for same slotDate & slotFrom-slotTo
    const overlapCount = await Booking.countDocuments({
      amenity: amenity._id,
      slotDate: sd,
      slotFrom: slotFrom,
      slotTo: slotTo,
      status: "booked",
    });

    const capacity = amenity.capacity || 1;
    if (overlapCount >= capacity) return fail(res, "Slot fully booked", 409);

    const booking = await Booking.create({
      amenity: amenity._id,
      society: req.user.society,
      user: req.user.sub,
      slotDate: sd,
      slotFrom,
      slotTo,
      price: req.body.price || amenity.pricePerSlot || 0,
      status: "booked",
    });

    return success(res, "Amenity booked", booking, 201);
  } catch (err) {
    next(err);
  }
};

/* ---------------- Penalty ---------------- */
exports.createPenalty = async (req, res, next) => {
  try {
    const payload = Object.assign({}, req.body, {
      society: req.user.society,
      issuedBy: req.user.sub,
    });
    const p = await Penalty.create(payload);
    return success(res, "Penalty created", p, 201);
  } catch (err) {
    next(err);
  }
};

exports.listPenalties = async (req, res, next) => {
  try {
    const items = await Penalty.find({ society: req.user.society })
      .sort({ createdAt: -1 })
      .limit(200);
    return success(res, "Penalties fetched", items);
  } catch (err) {
    next(err);
  }
};
