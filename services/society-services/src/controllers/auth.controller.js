// src/controllers/auth.controller.js
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const config = require("../config/env"); // adjust if your config file is in a different path
const logger = require("../utils/logger");
const { success, fail } = require("../utils/response");

const STATIC_OTP = "1234";
const TOKEN_TTL = "7d";

// helper to create JWT
async function signToken(user) {
  const payload = {
    sub: user._id.toString(),
    role: user.role,
    mobile: user.mobileNumber,
  };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: TOKEN_TTL });
}

/**
 * Request OTP
 * - Only sends OTP, doesn't create user
 */
exports.requestOtp = async (req, res, next) => {
  try {
    const mobile = req.body.mobile;
    if (!mobile) return fail(res, "Mobile number is required", 400);

    // Check if user exists
    const user = await User.findOne({ mobileNumber: mobile });
    if (!user) {
      return fail(res, "User not found, please contact admin", 404);
    }

    // (for now) send static OTP
    logger.info(`OTP requested for ${mobile} — static OTP ${STATIC_OTP}`);
    return success(res, "OTP sent successfully (static for dev)", { otp: STATIC_OTP });
  } catch (err) {
    next(err);
  }
};

/**
 * Verify OTP
 * - Verifies OTP and logs in only existing users
 */
exports.verifyOtp = async (req, res, next) => {
  try {
    const mobile = req.body.mobile;
    const { otp } = req.body;

    if (!mobile || !otp) return fail(res, "Mobile and OTP are required", 400);
    if (String(otp) !== STATIC_OTP) return fail(res, "Invalid OTP", 401);

    // Find user (must already exist)
    const user = await User.findOne({ mobileNumber: mobile });
    if (!user) {
      return fail(res, "User not found, please contact admin", 404);
    }

    // Generate JWT
    const token = await signToken(user);

    const safeUser = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobileNumber: user.mobileNumber,
      role: user.role,
      society: user.society,
      status: user.status,
      createdAt: user.createdAt,
    };

    return success(res, "OTP verified successfully", { token, user: safeUser });
  } catch (err) {
    next(err);
  }
};
