import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "EventHub API",
      version: "1.0.0",
      description: "API Documentation for EventHub Backend",
    },
    servers: [
      {
        url: "http://localhost:8000",
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Paths to files containing OpenAPI definitions
  apis: ["./src/routers/*.routes.ts", "./src/controllers/*.controller.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
