// src/config/swagger.js
const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Real Estate OS - Society Services API",
      version: "1.0.0",
      description:
        "API documentation for Society Services module (Society, Auth, User, Manager flows)",
    },
    servers: [
      {
        url: "http://localhost:8080/api/v1",
        description: "Local Dev Server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: [
    "./src/routes/*.js", // all route files will be scanned for Swagger annotations
  ],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
