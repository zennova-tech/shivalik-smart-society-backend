// src/controllers/society.controller.js
const Society = require("../models/society.model");
const { success, fail } = require("../utils/response");

exports.create = async (req, res, next) => {
  try {
    const society = await Society.create(req.body);
    return success(res, "Society created successfully", society, 201);
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const items = await Society.find();
    return success(res, "Societies fetched successfully", items);
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const society = await Society.findById(req.params.id);
    if (!society) return fail(res, "Society not found", 404);
    return success(res, "Society details fetched", society);
  } catch (err) {
    next(err);
  }
};
