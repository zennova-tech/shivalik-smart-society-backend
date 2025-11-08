const Society = require("../models/society.model");
const { validationResult } = require("express-validator");

exports.create = async (req, res, next) => {
  try {
    const payload = req.body;
    const society = new Society(payload);
    await society.save();

    // send welcome email to admin (demo purpose)
    if (payload.adminEmail) {
      await sendWelcomeEmail({
        name: payload.adminName || "Admin",
        email: payload.adminEmail,
        societyName: payload.name,
      });
    }

    res
      .status(201)
      .json({ message: "Society created and welcome email sent!", society });
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const items = await Society.find().limit(100);
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const s = await Society.findById(req.params.id).populate(
      "adminUser",
      "name email"
    );
    if (!s) return res.status(404).json({ message: "Not found" });
    res.json(s);
  } catch (err) {
    next(err);
  }
};
