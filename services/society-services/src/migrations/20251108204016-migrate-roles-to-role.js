// src/migrations/20251109-migrate-roles-to-role.js
module.exports = {
  async up(db, client) {
    // For docs with roles array and no role string, take first element as role
    const cursor = db
      .collection("users")
      .find({ roles: { $exists: true }, role: { $exists: false } });
    let count = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const rolesArr = doc.roles;
      let newRole = "member";
      if (Array.isArray(rolesArr) && rolesArr.length > 0) newRole = rolesArr[0];
      await db
        .collection("users")
        .updateOne({ _id: doc._id }, { $set: { role: newRole }, $unset: { roles: "" } });
      count++;
    }
    console.log(`[migration] migrated ${count} users: roles array -> role string`);
  },

  async down(db, client) {
    // Rollback: convert role string back to roles array for documents that don't have roles
    const cursor = db
      .collection("users")
      .find({ roles: { $exists: false }, role: { $exists: true } });
    let count = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const r = doc.role || "member";
      await db
        .collection("users")
        .updateOne({ _id: doc._id }, { $set: { roles: [r] }, $unset: { role: "" } });
      count++;
    }
    console.log(`[migration] rolled back ${count} users: role string -> roles array`);
  },
};
