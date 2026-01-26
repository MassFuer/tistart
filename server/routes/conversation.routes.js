const router = require("express").Router();
const Conversation = require("../models/Conversation.model");
const Message = require("../models/Message.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

// GET /api/conversations - List user's conversations
router.get("/", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { status = "active", limit = 20, offset = 0 } = req.query;

    const query = {
      participants: userId,
    };

    if (status !== "all") {
      query.status = status;
    }

    const conversations = await Conversation.find(query)
      .sort({ "lastMessage.createdAt": -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .populate("participants", "firstName lastName userName profilePicture role artistStatus artistInfo.companyName")
      .populate("artwork", "title images price")
      .populate("lastMessage.sender", "firstName lastName userName")
      .lean();

    // Add unread count for current user
    const conversationsWithUnread = conversations.map((conv) => ({
      ...conv,
      unreadCount: conv.unreadCount?.get?.(userId.toString()) || conv.unreadCount?.[userId.toString()] || 0,
    }));

    const total = await Conversation.countDocuments(query);

    res.json({
      conversations: conversationsWithUnread,
      total,
      hasMore: offset + conversations.length < total,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/conversations/:id - Get conversation details
router.get("/:id", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { id } = req.params;

    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId,
    })
      .populate("participants", "firstName lastName userName profilePicture role artistStatus artistInfo.companyName")
      .populate("artwork", "title images price artist")
      .lean();

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.json(conversation);
  } catch (error) {
    next(error);
  }
});

// POST /api/conversations - Start new conversation
router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { participantId, artworkId, initialMessage } = req.body;

    if (!participantId) {
      return res.status(400).json({ message: "Participant ID is required" });
    }

    if (participantId === userId) {
      return res.status(400).json({ message: "Cannot start conversation with yourself" });
    }

    // Find or create conversation
    const conversation = await Conversation.findOrCreateConversation(
      [userId, participantId],
      artworkId || null
    );

    // Populate the conversation
    await conversation.populate([
      { path: "participants", select: "firstName lastName userName profilePicture role artistStatus artistInfo.companyName" },
      { path: "artwork", select: "title images price artist" },
    ]);

    // If initial message provided, create it
    if (initialMessage && initialMessage.trim()) {
      const message = await Message.create({
        conversation: conversation._id,
        sender: userId,
        content: initialMessage.trim(),
        type: "text",
      });

      // Update conversation's last message
      await conversation.updateLastMessage(message);

      // Increment unread count for the other participant
      await conversation.incrementUnread(participantId);
    }

    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/conversations/:id - Archive conversation
router.delete("/:id", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { id } = req.params;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: id, participants: userId },
      { status: "archived" },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.json({ message: "Conversation archived", conversation });
  } catch (error) {
    next(error);
  }
});

// GET /api/conversations/:id/messages - Get messages (paginated)
router.get("/:id/messages", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { id } = req.params;
    const { limit = 50, before, after } = req.query;

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.getConversationMessages(id, {
      limit: Number(limit),
      before,
      after,
    });

    res.json({
      messages,
      hasMore: messages.length === Number(limit),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/conversations/:id/messages - Send message (REST fallback)
router.post("/:id/messages", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { id } = req.params;
    const { content, type = "text" } = req.body;

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId,
      status: "active",
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    // Create message
    const message = await Message.create({
      conversation: id,
      sender: userId,
      content: content.trim(),
      type,
      readBy: [{ user: userId, readAt: new Date() }],
    });

    // Populate sender info
    await message.populate("sender", "firstName lastName userName profilePicture role artistStatus");

    // Update conversation's last message
    await conversation.updateLastMessage(message);

    // Increment unread count for other participants
    const otherParticipants = conversation.participants.filter(
      (p) => p.toString() !== userId
    );
    for (const participantId of otherParticipants) {
      await conversation.incrementUnread(participantId);
    }

    // Emit socket event if io is available
    const io = req.app.get("io");
    if (io) {
      io.to(`conversation:${id}`).emit("message:new", {
        message,
        conversationId: id,
      });
    }

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/conversations/:id/read - Mark messages as read
router.patch("/:id/read", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { id } = req.params;

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Mark all messages as read
    await Message.markAllAsRead(id, userId);

    // Reset unread count
    await conversation.resetUnread(userId);

    // Emit socket event if io is available
    const io = req.app.get("io");
    if (io) {
      io.to(`conversation:${id}`).emit("messages:read", {
        conversationId: id,
        userId,
      });
    }

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    next(error);
  }
});

// POST /api/conversations/:id/offer - Make price offer
router.post("/:id/offer", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ message: "Valid offer amount is required" });
    }

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId,
      status: "active",
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Create offer message
    const message = await Message.create({
      conversation: id,
      sender: userId,
      content: `Price offer: €${amount.toFixed(2)}`,
      type: "offer",
      offer: {
        amount,
        status: "pending",
      },
      readBy: [{ user: userId, readAt: new Date() }],
    });

    await message.populate("sender", "firstName lastName userName profilePicture role artistStatus");

    // Update conversation negotiation status
    conversation.negotiation.currentOffer = amount;
    conversation.negotiation.status = "pending";
    conversation.negotiation.offerHistory.push({
      amount,
      offeredBy: userId,
      status: "pending",
    });

    // Update last message
    await conversation.updateLastMessage(message);
    await conversation.save();

    // Increment unread for other participants
    const otherParticipants = conversation.participants.filter(
      (p) => p.toString() !== userId
    );
    for (const participantId of otherParticipants) {
      await conversation.incrementUnread(participantId);
    }

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`conversation:${id}`).emit("message:new", {
        message,
        conversationId: id,
      });
      io.to(`conversation:${id}`).emit("offer:new", {
        conversationId: id,
        offer: message.offer,
        offeredBy: userId,
      });
    }

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/conversations/:id/offer/:offerId - Respond to offer
router.patch("/:id/offer/:offerId", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { id, offerId } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'accepted' or 'rejected'" });
    }

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId,
      status: "active",
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Find the offer message
    const offerMessage = await Message.findOne({
      _id: offerId,
      conversation: id,
      type: "offer",
    });

    if (!offerMessage) {
      return res.status(404).json({ message: "Offer not found" });
    }

    // Cannot respond to own offer
    if (offerMessage.sender.toString() === userId) {
      return res.status(400).json({ message: "Cannot respond to your own offer" });
    }

    // Update offer status
    offerMessage.offer.status = status;
    await offerMessage.save();

    // Update conversation negotiation
    conversation.negotiation.status = status;
    const lastOffer = conversation.negotiation.offerHistory[
      conversation.negotiation.offerHistory.length - 1
    ];
    if (lastOffer) {
      lastOffer.status = status;
    }
    await conversation.save();

    // Create system message about the response
    const systemMessage = await Message.create({
      conversation: id,
      sender: userId,
      content: `Offer ${status}: €${offerMessage.offer.amount.toFixed(2)}`,
      type: "system",
    });

    await systemMessage.populate("sender", "firstName lastName userName profilePicture");

    // Update last message
    await conversation.updateLastMessage(systemMessage);

    // Emit socket events
    const io = req.app.get("io");
    if (io) {
      io.to(`conversation:${id}`).emit("offer:response", {
        conversationId: id,
        offerId,
        status,
        respondedBy: userId,
      });
      io.to(`conversation:${id}`).emit("message:new", {
        message: systemMessage,
        conversationId: id,
      });
    }

    res.json({ message: `Offer ${status}`, offer: offerMessage.offer });
  } catch (error) {
    next(error);
  }
});

// GET /api/conversations/unread/count - Get total unread count
router.get("/unread/count", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;

    const conversations = await Conversation.find({
      participants: userId,
      status: "active",
    }).lean();

    const totalUnread = conversations.reduce((acc, conv) => {
      const unread = conv.unreadCount?.get?.(userId.toString()) || conv.unreadCount?.[userId.toString()] || 0;
      return acc + unread;
    }, 0);

    res.json({ unreadCount: totalUnread });
  } catch (error) {
    next(error);
  }
});

module.exports = router;