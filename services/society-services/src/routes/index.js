const express = require("express");
const router = express.Router();
const healthController = require("../controllers/health.controller");
const societyRoutes = require("./society.routes");
const authRoutes = require("./auth.routes");

router.get("/health", healthController.ping);
router.use("/auth", authRoutes);
router.use("/societies", societyRoutes);

module.exports = router;
