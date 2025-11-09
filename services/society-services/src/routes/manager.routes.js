// src/routes/manager.routes.js
const express = require("express");
const router = express.Router();
const manager = require("../controllers/manager.controller");
const { required } = require("../middleware/auth");

// Dashboard
router.get("/dashboard", required, manager.dashboard);

// Building settings
router.post("/building", required, manager.createOrUpdateBuilding);
router.put("/building/:id", required, manager.createOrUpdateBuilding);
router.get("/building/:id", required, manager.getBuilding);

// Blocks / Floors / Units
router.post("/blocks", required, manager.createBlock);
router.post("/floors", required, manager.createFloor);
router.post("/units", required, manager.createUnit);

// Users
router.get("/users", required, manager.listUsers);

// Amenities & booking
router.post("/amenities", required, manager.createAmenity);
router.get("/amenities", required, manager.listAmenities);
router.post("/amenities/book", required, manager.bookAmenity);

// Complaints
router.post("/complaints", required, manager.createComplaint);
router.get("/complaints", required, manager.listComplaints);

// Parking
router.post("/parkings", required, manager.createParking);
router.post("/parking/slots", required, manager.createParkingSlot);
router.post("/parking/assign", required, manager.assignParking);

// Events & gallery
router.post("/events", required, manager.createEvent);
router.get("/events", required, manager.listEvents);
router.post("/galleries", required, manager.addGallery);

// Bills & Penalty
router.post("/bills", required, manager.createBill);
router.get("/bills", required, manager.listBills);
router.post("/penalties", required, manager.createPenalty);
router.get("/penalties", required, manager.listPenalties);

module.exports = router;
