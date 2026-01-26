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