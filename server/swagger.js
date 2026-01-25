const { swaggerAutogen, outputFile, routes, doc } = require("./config/swagger");

// Generate swagger documentation
swaggerAutogen(outputFile, routes, doc).then(() => {
  console.log("Swagger documentation generated successfully!");
  console.log(`Output: ${outputFile}`);
});
