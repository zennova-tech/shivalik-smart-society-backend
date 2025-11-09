// src/validators/amenity.validators.js
const { body, param } = require("express-validator");

exports.createAmenityValidator = [
  body("name")
    .notEmpty()
    .withMessage("Amenity name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Amenity name must be between 2 and 100 characters"),

  body("description").optional().isString().withMessage("Description must be a string"),

  body("capacity").optional().isInt({ min: 1 }).withMessage("Capacity must be a positive number"),

  body("amenityType")
    .optional()
    .isIn(["free", "paid"])
    .withMessage("Amenity type must be either 'free' or 'paid'"),

  body("photoUrl").optional().isString().withMessage("photoUrl must be a string"),

  body("bookingType")
    .optional()
    .isIn(["one_time", "recurring"])
    .withMessage("Booking type must be either 'one_time' or 'recurring'"),

  body("slots").optional().isArray().withMessage("Slots must be an array"),

  body("advanceBookingDays")
    .optional()
    .isInt({ min: 0 })
    .withMessage("advanceBookingDays must be a positive number"),

  body("building")
    .notEmpty()
    .withMessage("Building reference is required")
    .isMongoId()
    .withMessage("Invalid building ID format"),

  body("block").optional().isMongoId().withMessage("Invalid block ID format"),

  body("status")
    .optional()
    .isIn(["available", "unavailable", "maintenance"])
    .withMessage("Status must be one of 'available', 'unavailable', or 'maintenance'"),
];

// ✅ Update Amenity (all fields optional)
exports.updateAmenityValidator = [
  param("id").isMongoId().withMessage("Invalid Amenity ID"),
  body("name").optional().isString(),
  body("description").optional().isString(),
  body("type")
    .optional()
    .isIn(["clubhouse", "gym", "pool", "hall", "playground", "parking", "other"])
    .withMessage("Invalid amenity type"),
  body("society").optional().isMongoId(),
  body("rules").optional().isArray(),
  body("slotsEnabled").optional().isBoolean(),
];

// ✅ Add Slot
exports.addSlotValidator = [
  param("id").isMongoId().withMessage("Invalid Amenity ID"),
  body("date")
    .notEmpty()
    .withMessage("Slot date is required")
    .isISO8601()
    .withMessage("Invalid date format (use YYYY-MM-DD)"),

  body("startTime")
    .notEmpty()
    .withMessage("Start time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Start time must be in HH:mm format"),

  body("endTime")
    .notEmpty()
    .withMessage("End time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("End time must be in HH:mm format"),

  body("capacity").optional().isInt({ min: 1 }).withMessage("Capacity must be a positive integer"),
];

// ✅ Remove Slot
exports.removeSlotValidator = [
  param("id").isMongoId().withMessage("Invalid Amenity ID"),
  param("slotId").isMongoId().withMessage("Invalid Slot ID"),
];
