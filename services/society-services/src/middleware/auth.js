// src/middleware/auth.js
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

exports.optional = (req, res, next) => {
  const token = (req.headers.authorization || "").replace(/^Bearer\s?/i, "") || req.query.token;
  if (!token) return next();
  try {
    req.user = jwt.verify(token, jwtSecret);
  } catch (e) {
    // ignore invalid token for optional
  }
  next();
};

exports.required = (req, res, next) => {
  const token = (req.headers.authorization || "").replace(/^Bearer\s?/i, "") || req.query.token;
  if (!token) return res.status(401).json({ message: "Auth required" });
  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
