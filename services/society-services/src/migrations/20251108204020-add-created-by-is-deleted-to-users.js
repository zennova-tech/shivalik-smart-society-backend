module.exports = {
  async up(db, client) {
    // Add createdBy and isDeleted fields to user docs that don't have them
    await db
      .collection("users")
      .updateMany({ createdBy: { $exists: false } }, { $set: { createdBy: null } });

    await db
      .collection("users")
      .updateMany({ isDeleted: { $exists: false } }, { $set: { isDeleted: false } });

    console.log("[migration] ensured createdBy and isDeleted on users");
  },

  async down(db, client) {
    // rollback: remove these fields (be careful in prod)
    await db.collection("users").updateMany({}, { $unset: { createdBy: "", isDeleted: "" } });
    console.log("[migration] unset createdBy and isDeleted on users");
  },
};
