// src/controllers/auth.controller.js
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/env"); // adjust path if your config file differs
const logger = require("../utils/logger");
const { success, fail } = require("../utils/response");

const TOKEN_TTL = "7d";

// signToken helper (use role instead of roles)
function signToken(user) {
  const payload = {
    sub: user._id.toString(),
    role: user.role || "member",
    email: user.email || "",
  };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: TOKEN_TTL });
}

// POST /api/v1/auth/login
// body: { email, password }
exports.loginWithPassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, "Email and password are required", 400);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) return fail(res, "Invalid credentials", 401);

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return fail(res, "Invalid credentials", 401);

    if (user.status !== "active") return fail(res, "User inactive", 403);

    const token = signToken(user);

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

    return success(res, "Login successful", { token, user: safeUser });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/accept-invite
// body: { token, password }
exports.acceptInvite = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return fail(res, "Token and password are required", 400);

    const user = await User.findOne({ inviteToken: token, inviteExpiresAt: { $gt: new Date() } });
    if (!user) return fail(res, "Invite invalid or expired", 400);

    // set password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);

    user.invited = false;
    user.inviteToken = null;
    user.inviteExpiresAt = null;
    user.acceptedAt = new Date();
    user.status = "active";

    await user.save();

    const jwtToken = signToken(user);
    const safeUser = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      society: user.society,
    };

    return success(res, "Invite accepted", { token: jwtToken, user: safeUser });
  } catch (err) {
    next(err);
  }
};

// helper basic password validator
function validatePassword(password) {
  if (!password || typeof password !== "string") return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  // add more checks if you want: uppercase, number, special char
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (!hasNumber || !hasUpper || !hasLower || !hasSpecial) {
    return "Password must include upper, lower, number and special character";
  }
  return null;
}

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return fail(res, "currentPassword and newPassword are required", 400);
    }

    // get user id from JWT payload (support sub or id)
    const userId = req.user && (req.user.sub || req.user.id);
    if (!userId) return fail(res, "Authentication required", 401);

    const user = await User.findById(userId);
    if (!user) return fail(res, "User not found", 404);

    if (!user.passwordHash) {
      return fail(
        res,
        "Password change not available for this account. Please set your password via invite/reset flow.",
        400
      );
    }

    // verify current password
    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) return fail(res, "Current password is incorrect", 401);

    // validate new password policy
    const pwError = validatePassword(newPassword);
    if (pwError) return fail(res, pwError, 400);

    // hash and save
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    return success(res, "Password changed successfully", null);
  } catch (err) {
    next(err);
  }
};
