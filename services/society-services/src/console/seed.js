const { connect } = require("../config/db.config");
const Society = require("../models/society.model");

async function run() {
  await connect();
  await Society.deleteMany({});
  const s = await Society.create({
    name: "Default Society",
    address: "123 Main St",
  });
  console.log("Seeded", s);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
