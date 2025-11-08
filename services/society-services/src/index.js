const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { connect } = require("./config/db.config");
const routes = require("./routes");
const errorHandler = require("./middleware/error.handler");
const logger = require("./utils/logger");
const { port } = require("./config/env");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/v1", routes);

app.use(errorHandler);

async function start() {
  await connect();
  app.listen(port, () => {
    logger.info(`society-services listening on port ${port}`);
    logger.info(`Start srevice at http://localhost:${port}`);
  });
}

start().catch((err) => {
  logger.error(err);
  process.exit(1);
});
