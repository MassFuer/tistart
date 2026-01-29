const http = require("http");
const app = require("./app");
const { initializeSocket } = require("./socket");

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

// Make io available to routes
app.set("io", io);

// Set the PORT for our app
const PORT = process.env.PORT || 5005;

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Socket.io ready for connections`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n[SHUTDOWN] ${signal} received. Closing server...`);
  server.close(() => {
    console.log("[SHUTDOWN] HTTP server closed");
    const mongoose = require("mongoose");
    mongoose.connection.close(false).then(() => {
      console.log("[SHUTDOWN] MongoDB connection closed");
      process.exit(0);
    });
  });
  // Force exit after 10s
  setTimeout(() => {
    console.error("[SHUTDOWN] Forced exit after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));