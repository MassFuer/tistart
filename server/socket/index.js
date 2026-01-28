const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

/**
 * Initialize Socket.io server with JWT authentication
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} Socket.io server instance
 */
const initializeSocket = (httpServer) => {
  // Build allowed origins for Socket.io
  const socketOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
  ];
  if (process.env.CLIENT_URL) {
    socketOrigins.push(process.env.CLIENT_URL);
  }

  const io = new Server(httpServer, {
    cors: {
      origin: socketOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      // Try to get token from cookies first
      let token = null;

      if (socket.handshake.headers.cookie) {
        const cookies = cookie.parse(socket.handshake.headers.cookie);
        token = cookies.authToken;
      }

      // Fallback to auth header
      if (!token && socket.handshake.auth?.token) {
        token = socket.handshake.auth.token;
      }

      // Fallback to query parameter (for testing)
      if (!token && socket.handshake.query?.token) {
        token = socket.handshake.query.token;
      }

      if (!token) {
        return next(new Error("Authentication required"));
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
      socket.userId = decoded._id;
      socket.user = decoded;
      next();
    } catch (err) {
      console.error("Socket authentication error:", err.message);
      next(new Error("Invalid token"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log(`User connected: ${userId} (socket: ${socket.id})`);

    // Add to online users
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
      // Broadcast that user is now online (only when first socket connects)
      socket.broadcast.emit("user:status", { userId, isOnline: true });
    }
    onlineUsers.get(userId).add(socket.id);

    // Join user's personal room for direct notifications
    socket.join(`user:${userId}`);

    // Send current online users to the connecting client
    socket.emit("users:online", Array.from(onlineUsers.keys()));

    // Register event handlers
    require("./handlers/conversation")(io, socket, onlineUsers);
    require("./handlers/message")(io, socket, onlineUsers);
    require("./handlers/typing")(io, socket);

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${userId} (socket: ${socket.id}), reason: ${reason}`);

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          // Broadcast that user is now offline
          socket.broadcast.emit("user:status", { userId, isOnline: false });
        }
      }
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });
  });

  return io;
};

/**
 * Check if a user is online
 * @param {string} userId - User ID to check
 * @returns {boolean} Whether user is online
 */
const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

/**
 * Get all online users
 * @returns {string[]} Array of online user IDs
 */
const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

module.exports = {
  initializeSocket,
  isUserOnline,
  getOnlineUsers,
  onlineUsers,
};