const swaggerAutogen = require("swagger-autogen")({ openapi: "3.0.0" });

const doc = {
  info: {
    title: "Nemesis API",
    version: "1.0.0",
    description: "Artists platform API - Manage artworks, events, and artist profiles",
  },
  servers: [
    {
      url: "http://localhost:5005",
      description: "Development server",
    },
  ],
  tags: [
    { name: "Auth", description: "Authentication endpoints" },
    { name: "Artworks", description: "Artwork management" },
    { name: "Events", description: "Event management" },
    { name: "Users", description: "User management and favorites" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "authToken",
        description: "JWT token stored in HTTP-only cookie",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "507f1f77bcf86cd799439011" },
          firstName: { type: "string", example: "John" },
          lastName: { type: "string", example: "Doe" },
          userName: { type: "string", example: "johndoe" },
          email: { type: "string", example: "john@example.com" },
          role: { type: "string", enum: ["user", "artist", "admin"] },
          artistStatus: {
            type: "string",
            enum: ["none", "pending", "incomplete", "verified", "suspended"],
          },
          profilePicture: { type: "string" },
          favorites: { type: "array", items: { type: "string" } },
        },
      },
      Artwork: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string", example: "Sunset Dreams" },
          description: { type: "string" },
          artist: { type: "string" },
          price: { type: "number", example: 1200 },
          category: {
            type: "string",
            enum: ["painting", "sculpture", "photography", "digital", "music", "video", "other"],
          },
          images: { type: "array", items: { type: "string" } },
        },
      },
      Event: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string", example: "Art Exhibition 2025" },
          startDateTime: { type: "string", format: "date-time" },
          endDateTime: { type: "string", format: "date-time" },
          category: {
            type: "string",
            enum: ["exhibition", "concert", "workshop", "meetup", "other"],
          },
        },
      },
    },
  },
};

const outputFile = "./swagger-output.json";
const routes = ["./app.js"];

// Export for generating
module.exports = { swaggerAutogen, outputFile, routes, doc };
