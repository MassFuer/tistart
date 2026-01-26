const Conversation = require("../../models/Conversation.model");
const Message = require("../../models/Message.model");

/**
 * Handle message-related socket events
 * @param {Server} io - Socket.io server instance
 * @param {Socket} socket - Connected socket instance
 * @param {Map} onlineUsers - Map of online users
 */
module.exports = (io, socket, onlineUsers) => {
  const userId = socket.userId;

  // Send a message (real-time)
  socket.on("message:send", async ({ conversationId, content, type = "text", offer }) => {
    try {
      // Verify user is participant and conversation is active
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        status: "active",
      });

      if (!conversation) {
        socket.emit("error", { message: "Conversation not found or access denied" });
        return;
      }

      // Validate content
      if (type === "text" && (!content || !content.trim())) {
        socket.emit("error", { message: "Message content is required" });
        return;
      }

      // Create the message
      const messageData = {
        conversation: conversationId,
        sender: userId,
        type,
        readBy: [{ user: userId, readAt: new Date() }],
      };

      if (type === "text") {
        messageData.content = content.trim();
      } else if (type === "offer") {
        if (!offer || !offer.amount || offer.amount <= 0) {
          socket.emit("error", { message: "Valid offer amount is required" });
          return;
        }
        messageData.content = `Price offer: €${offer.amount.toFixed(2)}`;
        messageData.offer = {
          amount: offer.amount,
          status: "pending",
        };

        // Update conversation negotiation
        conversation.negotiation.currentOffer = offer.amount;
        conversation.negotiation.status = "pending";
        conversation.negotiation.offerHistory.push({
          amount: offer.amount,
          offeredBy: userId,
          status: "pending",
        });
        await conversation.save();
      }

      const message = await Message.create(messageData);

      // Populate sender info
      await message.populate(
        "sender",
        "firstName lastName userName profilePicture role artistStatus"
      );

      // Update conversation's last message
      await conversation.updateLastMessage(message);

      // Increment unread count for other participants
      const otherParticipants = conversation.participants.filter(
        (p) => p.toString() !== userId
      );

      for (const participantId of otherParticipants) {
        await conversation.incrementUnread(participantId);

        // Send notification to user's personal room
        io.to(`user:${participantId}`).emit("notification:message", {
          conversationId,
          message: {
            _id: message._id,
            content: message.content,
            sender: message.sender,
            type: message.type,
            createdAt: message.createdAt,
          },
        });
      }

      // Broadcast message to conversation room
      io.to(`conversation:${conversationId}`).emit("message:new", {
        conversationId,
        message,
      });

      // If it's an offer, also emit offer event
      if (type === "offer") {
        io.to(`conversation:${conversationId}`).emit("offer:new", {
          conversationId,
          offer: message.offer,
          offeredBy: userId,
          messageId: message._id,
        });
      }

      // Acknowledge successful send to sender
      socket.emit("message:sent", {
        conversationId,
        messageId: message._id,
        tempId: content, // Can be used for optimistic updates
      });
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Mark messages as read
  socket.on("messages:read", async ({ conversationId, messageIds }) => {
    try {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });

      if (!conversation) {
        return;
      }

      // Mark specific messages as read, or all if no IDs provided
      if (messageIds && messageIds.length > 0) {
        await Promise.all(
          messageIds.map(async (messageId) => {
            const message = await Message.findById(messageId);
            if (message) {
              await message.markAsRead(userId);
            }
          })
        );
      } else {
        await Message.markAllAsRead(conversationId, userId);
      }

      // Reset unread count for user
      await conversation.resetUnread(userId);

      // Broadcast read receipt
      io.to(`conversation:${conversationId}`).emit("messages:read", {
        conversationId,
        userId,
        messageIds,
        readAt: new Date(),
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  });

  // Respond to an offer
  socket.on("offer:respond", async ({ conversationId, messageId, status }) => {
    try {
      if (!["accepted", "rejected"].includes(status)) {
        socket.emit("error", { message: "Invalid offer response status" });
        return;
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        status: "active",
      });

      if (!conversation) {
        socket.emit("error", { message: "Conversation not found" });
        return;
      }

      const offerMessage = await Message.findOne({
        _id: messageId,
        conversation: conversationId,
        type: "offer",
      });

      if (!offerMessage) {
        socket.emit("error", { message: "Offer not found" });
        return;
      }

      // Cannot respond to own offer
      if (offerMessage.sender.toString() === userId) {
        socket.emit("error", { message: "Cannot respond to your own offer" });
        return;
      }

      // Update offer status
      offerMessage.offer.status = status;
      await offerMessage.save();

      // Update conversation negotiation
      conversation.negotiation.status = status;
      const lastOffer =
        conversation.negotiation.offerHistory[
          conversation.negotiation.offerHistory.length - 1
        ];
      if (lastOffer) {
        lastOffer.status = status;
      }
      await conversation.save();

      // Create system message
      const systemMessage = await Message.create({
        conversation: conversationId,
        sender: userId,
        content: `Offer ${status}: €${offerMessage.offer.amount.toFixed(2)}`,
        type: "system",
      });

      await systemMessage.populate(
        "sender",
        "firstName lastName userName profilePicture"
      );

      // Update last message
      await conversation.updateLastMessage(systemMessage);

      // Broadcast offer response
      io.to(`conversation:${conversationId}`).emit("offer:response", {
        conversationId,
        messageId,
        status,
        respondedBy: userId,
      });

      // Broadcast system message
      io.to(`conversation:${conversationId}`).emit("message:new", {
        conversationId,
        message: systemMessage,
      });
    } catch (error) {
      console.error("Error responding to offer:", error);
      socket.emit("error", { message: "Failed to respond to offer" });
    }
  });
};