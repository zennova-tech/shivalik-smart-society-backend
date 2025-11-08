// src/migrations/20251109-create-important-indexes.js
module.exports = {
  async up(db, client) {
    // users: unique email, index mobileNumber and role
    try {
      await db.collection("users").createIndex({ email: 1 }, { unique: true, background: true });
    } catch (e) {
      console.warn("[migration] createIndex users.email (may already exist):", e.message);
    }
    try {
      await db.collection("users").createIndex({ mobileNumber: 1 }, { background: true });
    } catch (e) {}
    try {
      await db.collection("users").createIndex({ role: 1 }, { background: true });
    } catch (e) {}

    // societies: unique code
    try {
      await db
        .collection("societies")
        .createIndex({ code: 1 }, { unique: true, background: true, sparse: true });
    } catch (e) {}

    // units: compound index for quick lookup
    try {
      await db
        .collection("units")
        .createIndex(
          { society: 1, block: 1, floor: 1, number: 1 },
          { unique: true, background: true, sparse: true }
        );
    } catch (e) {}

    // bookings: query by society and slotDate
    try {
      await db
        .collection("bookings")
        .createIndex({ society: 1, slotDate: 1 }, { background: true });
    } catch (e) {}

    // complaints: society + status
    try {
      await db
        .collection("complaints")
        .createIndex({ society: 1, status: 1 }, { background: true });
    } catch (e) {}

    // parking slots: unique per society, level, slotNumber
    try {
      await db
        .collection("parkingSlots")
        .createIndex(
          { society: 1, level: 1, slotNumber: 1 },
          { unique: true, background: true, sparse: true }
        );
    } catch (e) {}

    console.log("[migration] created important indexes (or skipped if already present)");
  },

  async down(db, client) {
    // try drop indexes if they exist (names may vary)
    const dropIfExists = async (col, idx) => {
      try {
        await db.collection(col).dropIndex(idx);
        console.log(`[migration] dropped index ${idx} on ${col}`);
      } catch (e) {
        // ignore missing
      }
    };

    await dropIfExists("users", "email_1");
    await dropIfExists("users", "mobileNumber_1");
    await dropIfExists("users", "role_1");
    await dropIfExists("societies", "code_1");
    await dropIfExists("units", "society_1_block_1_floor_1_number_1");
    await dropIfExists("bookings", "society_1_slotDate_1");
    await dropIfExists("complaints", "society_1_status_1");
    await dropIfExists("parkingSlots", "society_1_level_1_slotNumber_1");
  },
};
