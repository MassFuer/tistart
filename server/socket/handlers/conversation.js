const Conversation = require("../../models/Conversation.model");

/**
 * Handle conversation-related socket events
 * @param {Server} io - Socket.io server instance
 * @param {Socket} socket - Connected socket instance
 * @param {Map} onlineUsers - Map of online users
 */
module.exports = (io, socket, onlineUsers) => {
  const userId = socket.userId;

  // Join a conversation room
  socket.on("conversation:join", async ({ conversationId }) => {
    try {
      // Verify user is a participant
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });

      if (!conversation) {
        socket.emit("error", { message: "Conversation not found or access denied" });
        return;
      }

      // Join the conversation room
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${userId} joined conversation ${conversationId}`);

      // Notify other participants
      socket.to(`conversation:${conversationId}`).emit("user:joined", {
        conversationId,
        userId,
      });
    } catch (error) {
      console.error("Error joining conversation:", error);
      socket.emit("error", { message: "Failed to join conversation" });
    }
  });

  // Leave a conversation room
  socket.on("conversation:leave", ({ conversationId }) => {
    socket.leave(`conversation:${conversationId}`);
    console.log(`User ${userId} left conversation ${conversationId}`);

    // Notify other participants
    socket.to(`conversation:${conversationId}`).emit("user:left", {
      conversationId,
      userId,
    });
  });

  // Get online status of conversation participants
  socket.on("conversation:participants:status", async ({ conversationId }) => {
    try {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });

      if (!conversation) {
        return;
      }

      const participantsStatus = conversation.participants.map((participantId) => ({
        participantId: participantId.toString(),
        isOnline: onlineUsers.has(participantId.toString()),
      }));

      socket.emit("conversation:participants:status", {
        conversationId,
        participants: participantsStatus,
      });
    } catch (error) {
      console.error("Error getting participants status:", error);
    }
  });
};