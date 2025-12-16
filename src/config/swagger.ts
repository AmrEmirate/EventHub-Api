import swaggerJsdoc from "swagger-jsdoc";

const getServerUrl = () => {
  if (!process.env.API_BASE_URL) {
    throw new Error(
      "API_BASE_URL environment variable is required for Swagger"
    );
  }
  return process.env.API_BASE_URL.replace("/api", "");
};

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
        url: getServerUrl(),
        description:
          process.env.NODE_ENV === "production"
            ? "Production Server"
            : "Development Server",
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
  apis: ["./src/routers/*.routes.ts", "./src/controllers/*.controller.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
