// src/console/seeds/example.seed.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const env = require("../../config/env");
const { connect } = require("../../config/db.config");

const Society = require("../../models/society.model");
const User = require("../../models/user.model");
const BuildingSetting = require("../../models/building.model");
const Block = require("../../models/block.model");
const Floor = require("../../models/floor.model");
const Unit = require("../../models/unit.model");
const Parking = require("../../models/parking.model");
const ParkingSlot = require("../../models/parkingSlot.model");
const ParkingAssignment = require("../../models/parkingAssignment.model");
const Amenity = require("../../models/amenity.model");
const Booking = require("../../models/booking.model");
const Event = require("../../models/event.model");
const Gallery = require("../../models/gallery.model");
const Bill = require("../../models/bill.model");
const Penalty = require("../../models/penalty.model");

// (optional) create if complaint model exists
let Complaint;
try {
  Complaint = require("../../models/complaint.model");
} catch {
  Complaint = null;
}

async function seedDummy() {
  await connect();

  // clear everything if you want fresh
  // await Promise.all([...models].map(m => m.deleteMany({})));

  console.log("🌱 Seeding dummy data...");

  /** 1️⃣ Create society **/
  const society = await Society.findOneAndUpdate(
    { name: "Shivalik Greens" },
    {
      name: "Shivalik Greens",
      territory: "Gujarat",
      address: "Sola Road, Ahmedabad",
      code: "SHV-2025-DUMMY",
      createdAt: new Date(),
    },
    { upsert: true, new: true }
  );

  /** 2️⃣ Create users **/
  const salt = await bcrypt.genSalt(10);
  const pass = await bcrypt.hash("Test@123", salt);

  const admin = await User.findOneAndUpdate(
    { email: "admin@shivalik.com" },
    {
      firstName: "Shivalik",
      lastName: "Admin",
      email: "admin@shivalik.com",
      countryCode: "+91",
      mobileNumber: "9999999999",
      passwordHash: pass,
      role: "manager",
      society: society._id,
      status: "active",
    },
    { upsert: true, new: true }
  );

  const resident = await User.findOneAndUpdate(
    { email: "resident1@shivalik.com" },
    {
      firstName: "Resident",
      lastName: "One",
      email: "resident1@shivalik.com",
      mobileNumber: "8888888888",
      role: "member",
      society: society._id,
      passwordHash: pass,
    },
    { upsert: true, new: true }
  );

  /** 3️⃣ Create Building **/
  const building = await BuildingSetting.findOneAndUpdate(
    { "society.ref": society._id },
    {
      society: { name: society.name, ref: society._id },
      buildingName: "Tower A",
      address: "Sola Rd",
      city: "Ahmedabad",
      state: "Gujarat",
      pinCode: "380060",
      totalBlocks: 2,
      totalUnits: 20,
      createdBy: admin._id,
    },
    { upsert: true, new: true }
  );

  /** 4️⃣ Blocks + Floors + Units **/
  const blockA = await Block.findOneAndUpdate(
    { name: "A", building: building._id },
    { name: "A", building: building._id, createdBy: admin._id },
    { upsert: true, new: true }
  );

  const floor1 = await require("../../models/floor.model").findOneAndUpdate(
    { block: blockA._id, number: 1 },
    { block: blockA._id, name: "Floor 1", number: 1, createdBy: admin._id },
    { upsert: true, new: true }
  );

  const unit101 = await Unit.findOneAndUpdate(
    { unitNumber: "A-101" },
    {
      unitNumber: "A-101",
      unitType: "2BHK",
      block: blockA._id,
      floor: floor1._id,
      owner: resident._id,
      createdBy: admin._id,
    },
    { upsert: true, new: true }
  );

  /** 5️⃣ Parking + Slot + Assignment **/
  const parking = await Parking.findOneAndUpdate(
    { name: "Basement Parking", building: building._id },
    {
      name: "Basement Parking",
      memberCarSlots: 10,
      visitorCarSlots: 2,
      building: building._id,
      createdBy: admin._id,
    },
    { upsert: true, new: true }
  );

  const slot1 = await ParkingSlot.findOneAndUpdate(
    { slotNumber: "P1" },
    {
      society: society._id,
      parking: parking._id,
      slotNumber: "P1",
      slotType: "car",
      createdBy: admin._id,
    },
    { upsert: true, new: true }
  );

  await ParkingAssignment.findOneAndUpdate(
    { slot: slot1._id },
    {
      society: society._id,
      slot: slot1._id,
      user: resident._id,
      vehicleNumber: "GJ01AB1234",
      type: "permanent",
      createdBy: admin._id,
    },
    { upsert: true, new: true }
  );

  /** 6️⃣ Amenity + Booking **/
  const amenity = await Amenity.findOneAndUpdate(
    { name: "Club House", createdBy: admin._id },
    {
      name: "Club House",
      description: "Main hall",
      amenityType: "free",
      capacity: 10,
      society: society._id,
      createdBy: admin._id,
    },
    { upsert: true, new: true }
  );

  await Booking.findOneAndUpdate(
    { user: resident._id, amenity: amenity._id },
    {
      society: society._id,
      amenity: amenity._id,
      user: resident._id,
      slotDate: new Date(),
      slotFrom: "10:00",
      slotTo: "11:00",
      createdBy: resident._id,
    },
    { upsert: true, new: true }
  );

  /** 7️⃣ Event **/
  await Event.findOneAndUpdate(
    { title: "Diwali Celebration", society: society._id },
    {
      title: "Diwali Celebration",
      description: "Celebrate Diwali together",
      society: society._id,
      startAt: new Date(Date.now() + 86400000),
      endAt: new Date(Date.now() + 172800000),
      createdBy: admin._id,
    },
    { upsert: true, new: true }
  );

  /** 8️⃣ Gallery **/
  await Gallery.findOneAndUpdate(
    { title: "Main Gate" },
    {
      society: society._id,
      title: "Main Gate",
      description: "Society entrance photo",
      images: ["https://placehold.co/600x400"],
      createdBy: admin._id,
    },
    { upsert: true, new: true }
  );

  /** 9️⃣ Bill **/
  await Bill.findOneAndUpdate(
    { title: "Maintenance - Nov 2025" },
    {
      society: society._id,
      unit: unit101._id,
      user: resident._id,
      title: "Maintenance - Nov 2025",
      amount: 1500,
      dueDate: new Date(Date.now() + 10 * 86400000),
      createdBy: admin._id,
    },
    { upsert: true, new: true }
  );

  /** 🔟 Penalty **/
  await Penalty.findOneAndUpdate(
    { title: "Late Payment Fine" },
    {
      society: society._id,
      user: resident._id,
      title: "Late Payment Fine",
      description: "Fine for delayed maintenance payment",
      amount: 100,
      issuedBy: admin._id,
      createdBy: admin._id,
    },
    { upsert: true, new: true }
  );

  /** 11️⃣ Complaint (optional) **/
  if (Complaint) {
    await Complaint.findOneAndUpdate(
      { description: "Water leakage in bathroom" },
      {
        society: society._id,
        raisedBy: resident._id,
        category: "Maintenance",
        description: "Water leakage in bathroom",
        status: "open",
        createdBy: resident._id,
      },
      { upsert: true, new: true }
    );
  }

  console.log("✅ Dummy data seeded successfully.");
  mongoose.connection.close();
}

seedDummy().catch((err) => {
  console.error("❌ Error seeding dummy data:", err);
  mongoose.connection.close();
});
