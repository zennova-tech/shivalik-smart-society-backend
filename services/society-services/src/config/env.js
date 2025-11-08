const path = require("path");
const dotenv = require("dotenv");

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.prod"
    : process.env.NODE_ENV === "staging"
    ? ".env.staging"
    : ".env.dev";

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

module.exports = {
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI,
  dbName: process.env.DB_NAME,
  jwtSecret: process.env.JWT_SECRET,
  logLevel: process.env.LOG_LEVEL || "info",
  aws: {
    bucket: process.env.AWS_S3_BUCKET,
    key: process.env.AWS_ACCESS_KEY_ID,
    secret: process.env.AWS_SECRET_ACCESS_KEY,
  },
  mailUser: process.env.MAIL_USER,
  mailPass: process.env.MAIL_PASS,
};
