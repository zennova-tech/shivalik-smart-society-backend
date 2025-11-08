// src/controllers/auth.controller.js
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const { success, fail } = require("../utils/response");
const { jwtSecret } = require("../config/env");

const STATIC_OTP = "1234";
const TOKEN_TTL = "7d";

exports.requestOtp = async (req, res, next) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return fail(res, "Mobile number is required", 400);

    logger.info(`OTP requested for ${mobile} — using static OTP ${STATIC_OTP}`);

    return success(res, "OTP sent successfully (static for dev)", { otp: STATIC_OTP });
  } catch (err) {
    next(err);
  }
};

async function signToken(user) {
  const payload = { sub: user._id.toString(), role: user.role, mobile: user.mobile };
  return jwt.sign(payload, jwtSecret, { expiresIn: TOKEN_TTL });
}

exports.verifyOtp = async (req, res, next) => {
  try {
    const { mobile, otp, name, email } = req.body;
    if (!mobile || !otp) return fail(res, "Mobile and OTP are required", 400);

    if (String(otp) !== STATIC_OTP) return fail(res, "Invalid OTP", 401);

    let user = await User.findOne({ mobile });

    if (!user) {
      const count = await User.countDocuments({});
      const role = count === 0 ? "admin" : "resident";

      user = new User({ mobile, name: name || "", email: email || "", role });
      await user.save();
      logger.info(`Created user ${mobile} with role ${role}`);
    }

    const token = await signToken(user);

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      society: user.society,
    };

    return success(res, "OTP verified successfully", { token, user: userData });
  } catch (err) {
    next(err);
  }
};
