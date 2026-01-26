/**
 * Handle typing indicator events
 * @param {Server} io - Socket.io server instance
 * @param {Socket} socket - Connected socket instance
 */
module.exports = (io, socket) => {
  const userId = socket.userId;

  // User started typing
  socket.on("typing:start", ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit("typing:update", {
      conversationId,
      userId,
      isTyping: true,
    });
  });

  // User stopped typing
  socket.on("typing:stop", ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit("typing:update", {
      conversationId,
      userId,
      isTyping: false,
    });
  });
};