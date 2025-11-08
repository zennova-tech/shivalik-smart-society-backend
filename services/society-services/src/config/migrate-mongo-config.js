const { mongoUri, dbName } = require("./env");

module.exports = {
  mongodb: {
    url: mongoUri,
    databaseName: dbName,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
  },
  migrationsDir: "src/migrations",
  changelogCollectionName: "migrations_changelog",
};
